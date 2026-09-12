"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

require("../js/ns.js");
require("../js/i18n.js");
require("../js/locale-en.js");
require("../js/locale-zh-cn.js");
require("../js/locale-zh-tw.js");
require("../js/locale-zh-hk.js");
require("../js/items.js");
require("../js/types.js");
const I18N = globalThis.SG.i18n;

const INDEX = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8");
const CHINESE = ["zh-cn", "zh-tw", "zh-hk"];

/* Every leaf string in a dictionary, as [dotted.path, text] pairs. */
function leaves(node, prefix) {
  return Object.keys(node).flatMap(function (key) {
    const at = prefix ? prefix + "." + key : key;
    const value = node[key];
    if (value && typeof value === "object") { return leaves(value, at); }
    return typeof value === "string" ? [[at, value]] : [];
  });
}

function stringsOf(locale) { return leaves(I18N.dict(locale), ""); }

function keysOf(locale) { return stringsOf(locale).map((pair) => pair[0]).sort(); }

/* ---- parity ---- */

/* types.* and items.* are overlays onto an English base, not a mirror of the
   English dictionary: js/types.js and js/items.js hold the English copy, and a
   locale carries only the fields it has words for yet. Every other key is
   interface copy that has no base to fall back to, so it must exist in full
   in every locale. */
function isOverlay(key) { return /^(types|items)\./.test(key); }

test("every locale carries exactly the interface keys English carries", () => {
  /* There is no compiler here to catch a missing key. A locale short of one
     falls back to English and looks merely untranslated; a locale carrying an
     extra one is a typo nothing will ever read. */
  const want = keysOf("en").filter((k) => !isOverlay(k));
  CHINESE.forEach((loc) => {
    const got = keysOf(loc).filter((k) => !isOverlay(k));
    const missing = want.filter((k) => got.indexOf(k) === -1);
    const extra = got.filter((k) => want.indexOf(k) === -1);
    assert.deepStrictEqual(missing, [], loc + " is missing keys");
    assert.deepStrictEqual(extra, [], loc + " carries keys English does not");
  });
});

test("a type overlay only ever names a real type and a real field of it", () => {
  /* The overlay is where a typo hides: types.INFJ.openning would simply never
     be read, and the English would show through looking merely untranslated. */
  const byCode = globalThis.SG.types.byCode;
  I18N.SUPPORTED.forEach((loc) => {
    const types = I18N.dict(loc).types || {};
    Object.keys(types).forEach((code) => {
      assert.ok(byCode[code], loc + " overlays " + code + ", which is not a type");
      Object.keys(types[code]).forEach((field) => {
        assert.ok(Object.prototype.hasOwnProperty.call(byCode[code], field),
          loc + " overlays " + code + "." + field + ", which is not a field of a type");
        assert.strictEqual(Array.isArray(types[code][field]), Array.isArray(byCode[code][field]),
          loc + " " + code + "." + field + " changed shape");
        if (Array.isArray(types[code][field])) {
          assert.strictEqual(types[code][field].length, byCode[code][field].length,
            loc + " " + code + "." + field + " has the wrong number of entries");
        }
      });
    });
  });
});

test("every data-i18n key in index.html exists in every locale", () => {
  const used = (INDEX.match(/\sdata-i18n="([^"]+)"/g) || [])
    .map((s) => s.slice(s.indexOf('"') + 1, -1));
  const attrs = (INDEX.match(/\sdata-i18n-attr="([^"]+)"/g) || [])
    .flatMap((s) => s.slice(s.indexOf('"') + 1, -1).split(","))
    .map((pair) => pair.slice(pair.indexOf(":") + 1).trim());
  const all = used.concat(attrs);
  assert.ok(all.length > 20, "the page lost its i18n markers, found " + all.length);

  I18N.SUPPORTED.forEach((loc) => {
    all.forEach((key) => {
      const value = key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), I18N.dict(loc));
      assert.strictEqual(typeof value, "string", loc + " has no string at " + key);
    });
  });
});

test("every placeholder English uses survives into every locale", () => {
  /* A dropped {done} does not throw. It renders a sentence with the number
     quietly missing, which reads like ordinary copy and would ship. */
  const wanted = {};
  stringsOf("en").forEach(([key, text]) => {
    const holes = (text.match(/\{\w+\}/g) || []).sort();
    if (holes.length) { wanted[key] = holes; }
  });
  assert.ok(Object.keys(wanted).length >= 4, "the templates lost their placeholders");

  CHINESE.forEach((loc) => {
    stringsOf(loc).forEach(([key, text]) => {
      if (!wanted[key]) {
        assert.deepStrictEqual(text.match(/\{\w+\}/g) || [], [],
          loc + " invented a placeholder at " + key);
        return;
      }
      assert.deepStrictEqual((text.match(/\{\w+\}/g) || []).sort(), wanted[key],
        loc + " changed the placeholders at " + key);
    });
  });
});

test("the English dictionary never drifts from the English source", () => {
  /* locale-en.js restates copy that lives in js/items.js and js/types.js,
     because every locale carries the same keys and English is the fallback
     those keys resolve against. Restating it is only safe while the two
     cannot disagree, and nothing but this test makes that true. */
  const items = globalThis.SG.items.core.concat(globalThis.SG.items.tiebreak);
  items.forEach((item) => {
    assert.strictEqual(I18N.t("items." + item.id, "en"), item[item.show],
      "locale-en.js and js/items.js disagree about " + item.id);
  });
  Object.keys(globalThis.SG.types.byCode).forEach((code) => {
    const base = globalThis.SG.types.byCode[code];
    const over = I18N.type(code, "en");
    assert.strictEqual(over.name, base.name, "locale-en.js renamed " + code);
    assert.strictEqual(over.line, base.line, "locale-en.js rewrote " + code + "'s line");
  });
});

test("every item has a stable id, and a locale keys its statements on it", () => {
  /* Position would not do: renumbering js/items.js would silently re-point
     every translated statement at a different question. */
  const items = globalThis.SG.items.core.concat(globalThis.SG.items.tiebreak);
  const ids = items.map((i) => i.id);
  assert.strictEqual(ids.filter(Boolean).length, items.length, "an item has no id");
  assert.strictEqual(new Set(ids).size, items.length, "two items share an id");
  I18N.SUPPORTED.forEach((loc) => {
    const dict = I18N.dict(loc).items || {};
    Object.keys(dict).forEach((id) => {
      assert.ok(ids.indexOf(id) !== -1, loc + " translates " + id + ", which is not an item");
    });
  });
});

test("no locale is a copy of another", () => {
  /* Two Traditional locales that agreed on everything would mean one of them
     was converted from the other, which is the one thing the whole hand-
     written approach exists to prevent. Names and one-liners are the sample:
     they are the strings a region's own voice shows up in first. */
  const codes = Object.keys(globalThis.SG.types.byCode);
  const differ = codes.filter((c) =>
    I18N.type(c, "zh-tw").name !== I18N.type(c, "zh-hk").name ||
    I18N.type(c, "zh-tw").line !== I18N.type(c, "zh-hk").line);
  assert.ok(differ.length >= 12,
    "zh-tw and zh-hk agree on all but " + (16 - differ.length) + " of sixteen types");
});

/* ---- register ---- */

/* Written Cantonese. Every locale here is Standard Written Chinese, including
   Hong Kong's, which targets 書面語 and not 粵文.

   The list is deliberately narrow. 係 is NOT on it: it is the Cantonese copula
   but also ordinary written Chinese in 關係 and 係數, so blacklisting it would
   fire on correct copy and a noisy check gets muted. 他 and 不 are not markers
   either, in the other direction: 其他 and 不過 are ordinary Cantonese. */
const CANTONESE = ["佢", "咗", "嘅", "冇", "睇", "喺", "嘢", "嗰", "乜", "咁", "唔", "哋"];

test("no locale contains written Cantonese", () => {
  CHINESE.forEach((loc) => {
    stringsOf(loc).forEach(([key, text]) => {
      CANTONESE.forEach((marker) => {
        assert.ok(text.indexOf(marker) === -1,
          loc + " " + key + " uses the Cantonese " + marker + ": " + text);
      });
    });
  });
});

/* ---- script ---- */

/* Traditional and Simplified forms of the same character, as couples. This
   table is the whole reach of the check below: a character absent from it
   passes in either script, so the table has to grow with the copy. It was
   generated once from a standard pair list and then filtered.

   Ambiguous characters are deliberately absent. 里, 后, 只, 干, 云, 准, 願,
   志, 據, 幾, 面 and their kin are all real Traditional characters as well as
   the Simplified form of something else, so listing them would fail correct
   Traditional copy, and a check that fires on correct copy gets muted. */
const PAIRS =
  "亂乱亞亚來来俠侠倆俩倉仓們们偉伟側侧偵侦偽伪傘伞備备傳传傷伤傾倾僅仅僑侨價价儀仪億亿儈侩儉俭償偿優优儲储" +
  "兒儿內内兩两冊册凍冻凱凯別别則则剎刹剛刚剮剐創创劇剧劉刘劊刽劑剂勁劲動动務务勝胜勞劳勢势勵励勸劝協协卻却" +
  "厭厌參参叢丛呂吕員员問问啞哑啟启喚唤喪丧喬乔單单喲哟嗆呛嗎吗嘆叹嘔呕嘗尝嘩哗嘯啸噓嘘噴喷噸吨嚇吓嚙啮嚴严" +
  "囑嘱國国圍围園园圓圆圖图執执堅坚報报場场塊块塵尘墊垫墜坠墮堕墳坟墾垦壇坛壓压壘垒壞坏壟垄壯壮壺壶壽寿夠够" +
  "夢梦奪夺妝妆娛娱婦妇媽妈嬌娇嬰婴孫孙學学實实寫写寬宽寵宠寶宝專专尋寻對对導导屆届屢屡層层屬属島岛峽峡崗岗" +
  "嶼屿帥帅師师帳帐帶带幀帧幟帜幣币幫帮庫库廈厦廚厨廟庙廠厂廢废廣广廬庐廳厅張张彈弹彌弥彎弯徑径徵征徹彻恥耻" +
  "悅悦悶闷惡恶惱恼愛爱態态慘惨慚惭慣惯慮虑慶庆憂忧憊惫憐怜憑凭憚惮憤愤憫悯憲宪憶忆懇恳應应懲惩懷怀懸悬懼惧" +
  "懾慑戰战戶户挾挟掃扫掄抡掙挣揀拣揚扬換换揮挥損损搶抢摟搂摯挚摳抠撈捞撓挠撣掸撥拨撲扑撾挝擁拥擇择擊击擋挡" +
  "擔担擠挤擬拟擯摈擰拧擱搁擲掷擴扩擺摆擾扰攔拦攙搀攜携攝摄攤摊攪搅敗败敵敌數数斬斩斷断時时晉晋晝昼暢畅曆历" +
  "曉晓曠旷曬晒書书會会東东條条棄弃棗枣棟栋楊杨業业極极榮荣構构槍枪樁桩樂乐樓楼標标樞枢樣样樹树橋桥機机檔档" +
  "檢检檸柠檻槛櫥橱欄栏權权欽钦歐欧歡欢歲岁殲歼殺杀毆殴氈毡氣气決决沒没洶汹淚泪淨净淵渊淺浅渙涣減减測测渾浑" +
  "湊凑湯汤溝沟滄沧滅灭滌涤滬沪滯滞滲渗滾滚滿满漁渔漢汉漬渍漲涨潑泼潔洁潤润潰溃澀涩澆浇澇涝澤泽濁浊濃浓濕湿" +
  "濤涛濫滥濰潍濱滨濺溅濾滤瀉泻瀏浏瀕濒瀝沥灑洒灘滩灣湾災灾為为烏乌無无煉炼煙烟燈灯燒烧燙烫燦灿燭烛燴烩爐炉" +
  "爛烂爭争爺爷爾尔牆墙牽牵犢犊犧牺狀状狹狭狽狈猙狰猶犹獅狮獨独獲获獵猎獸兽現现瑣琐環环瓊琼甕瓮產产畝亩畢毕" +
  "畫画異异當当疊叠瘋疯瘡疮療疗癟瘪癢痒癥症癬癣癮瘾癱瘫皺皱盞盏盡尽監监盤盘盧卢眾众睜睁瞞瞒瞼睑矚瞩硯砚碩硕" +
  "確确磚砖礙碍礦矿禍祸禮礼禱祷種种稱称積积穎颖穢秽穩稳窩窝窪洼窮穷竄窜竅窍竈灶竊窃競竞筆笔箋笺節节篩筛簡简" +
  "簽签籠笼籮箩糞粪糧粮紀纪紅红紉纫紋纹納纳純纯紗纱紙纸級级紛纷紡纺紹绍組组絆绊結结絕绝絞绞絡络給给絨绒統统" +
  "絲丝綁绑經经綜综綠绿維维綱纲網网綴缀綻绽綽绰綿绵緊紧緒绪線线緞缎締缔緣缘編编緩缓緬缅練练縛缚縣县縫缝縮缩" +
  "縱纵縷缕總总績绩繃绷織织繞绕繡绣繩绳繪绘繳缴繼继續续纏缠纓缨纖纤缽钵罰罚罵骂罷罢羅罗聞闻聯联聰聪聲声聳耸" +
  "職职聽听聾聋肅肃脅胁脹胀腎肾腦脑腳脚膚肤膩腻膽胆膿脓臍脐臘腊臨临與与興兴舉举舊旧艙舱艦舰艷艳莖茎莢荚華华" +
  "萊莱萬万葉叶葷荤蓋盖蓮莲蔭荫蕩荡蕪芜蕭萧薦荐藍蓝藝艺藥药藪薮蘇苏蘋苹蘿萝處处虧亏蛻蜕蝕蚀蝦虾蝸蜗蟄蛰蟲虫" +
  "蟻蚁蠅蝇蠟蜡蠱蛊蠶蚕術术衛卫補补裝装褲裤襖袄襪袜襯衬襲袭見见規规覓觅視视親亲覺觉覽览觀观觸触訂订訃讣計计" +
  "訊讯討讨訓训訖讫記记訝讶訟讼訣诀訪访設设許许訴诉診诊詐诈評评詛诅詞词詢询試试詩诗詫诧話话該该詳详誅诛誇夸" +
  "認认誕诞誘诱語语誠诚誡诫誣诬誦诵說说誰谁課课誹诽誼谊調调談谈諒谅論论諜谍諧谐諮咨諱讳諷讽諸诸諺谚諾诺謀谋" +
  "謄誊謊谎謎谜謗谤謙谦講讲謝谢謠谣謹谨謾谩證证譏讥識识譚谭譜谱譯译議议譴谴護护譽誉讀读變变讒谗讓让豈岂豎竖" +
  "豬猪貓猫貝贝貞贞負负財财貧贫貨货販贩貪贪貫贯責责貯贮貳贰貴贵貶贬買买貸贷費费貼贴貿贸賀贺賄贿資资賈贾賊贼" +
  "賒赊賓宾賜赐賞赏賠赔賢贤賣卖賤贱賦赋質质賬账賭赌賴赖賺赚購购贈赠贊赞贏赢贖赎趕赶趙赵趨趋踐践踴踊蹤踪軀躯" +
  "車车軋轧軌轨軍军軒轩軟软軸轴較较輔辅輛辆輝辉輥辊輩辈輪轮輸输輾辗輿舆轉转轍辙轎轿轟轰辦办辮辫辯辩農农這这" +
  "連连進进遊游運运過过達达違违遜逊遞递遠远適适遲迟遷迁選选遺遗遼辽邁迈還还邊边邏逻郵邮鄉乡鄒邹鄧邓鄭郑鄰邻" +
  "醞酝醫医醬酱釀酿釁衅釋释釐厘針针釣钓鈍钝鈔钞鈴铃鉗钳鉚铆鉛铅鉻铬銀银銅铜銘铭銜衔銥铱銳锐銷销銻锑鋁铝鋒锋" +
  "鋤锄鋪铺鋸锯鋼钢錄录錐锥錘锤錠锭錢钱錦锦錫锡錯错鍋锅鍍镀鍛锻鍬锹鍵键鍺锗鎖锁鎬镐鎮镇鏽锈鐘钟鐳镭鐵铁鑄铸" +
  "鑑鉴鑰钥鑷镊鑼锣鑽钻鑿凿長长閉闭開开閏闰閒闲閘闸閡阂閣阁閥阀閩闽閱阅閹阉閻阎闊阔闔阖闖闯關关闡阐陣阵陰阴" +
  "陳陈陸陆陽阳隊队階阶際际隨随險险隱隐隸隶雖虽雙双雛雏雜杂雞鸡離离難难電电霧雾靈灵靜静韋韦韌韧韓韩韻韵響响" +
  "頁页頂顶項项順顺須须頌颂預预頑顽頒颁頓顿頗颇領领頤颐頭头頰颊頹颓頻频顆颗題题額额顏颜類类顧顾顫颤顯显風风" +
  "飛飞飯饭飲饮飼饲飽饱飾饰餅饼餌饵餒馁餓饿餡馅館馆饒饶饞馋馬马馭驭馮冯馳驰馴驯駁驳駐驻駒驹駕驾駛驶駭骇駱骆" +
  "駿骏騁骋騎骑騰腾騷骚騾骡驅驱驕骄驗验驚惊驢驴骯肮髒脏體体鬧闹魚鱼魯鲁鮮鲜鯨鲸鱉鳖鳥鸟鳩鸠鳳凤鳴鸣鴉鸦鴛鸳" +
  "鴨鸭鴻鸿鴿鸽鵑鹃鵝鹅鵬鹏鶯莺鶴鹤鷹鹰鹼碱麗丽麥麦麼么點点黨党黴霉齊齐齋斋齒齿齡龄齲龋龍龙龐庞龔龚龜龟";

const TRAD = new Set();
const SIMP = new Set();
for (let i = 0; i < PAIRS.length; i += 2) {
  TRAD.add(PAIRS[i]);
  SIMP.add(PAIRS[i + 1]);
}

test("every switcher name is written in the script it links to", () => {
  /* The one rule W3C, CLDR, Wikipedia and Apple all keep, and the most
     visible error this control can carry: 台湾 in Simplified on the option
     that leads to a Traditional page.

     Checked against the same pair table as the copy, never a second
     hand-written list. 台 is deliberately absent from that table: it is a
     real Traditional character, and 台灣 is the spelling Apple ships. */
  const forbidden = { "zh-cn": TRAD, "zh-hk": SIMP, "zh-tw": SIMP };
  CHINESE.forEach((loc) => {
    Array.from(I18N.NAME[loc]).forEach((ch) => {
      assert.ok(!forbidden[loc].has(ch),
        loc + " is named " + I18N.NAME[loc] + ", which uses the wrong-script " + ch);
    });
  });
  assert.ok(/[㐀-䶿一-鿿]/.test(I18N.NAME["zh-cn"]), "a Chinese locale must be named in Chinese");
});

test("the Traditional locales carry no Simplified character, and the Simplified one no Traditional", () => {
  /* This is the check a glyph converter would pass and a careless hand would
     fail. It is not the check that catches vocabulary, which is below. */
  const forbidden = { "zh-cn": TRAD, "zh-tw": SIMP, "zh-hk": SIMP };
  CHINESE.forEach((loc) => {
    stringsOf(loc).forEach(([key, text]) => {
      Array.from(text).forEach((ch) => {
        assert.ok(!forbidden[loc].has(ch),
          loc + " " + key + " uses the wrong-script " + ch + ": " + text);
      });
    });
  });
});

/* ---- vocabulary ---- */

/* The trap a converter cannot see. These are different words, not different
   glyphs: 網路 and 網絡 are both correct Traditional Chinese, in different
   places. Each entry is a word that belongs to one region and reads wrong in
   another. */
const WRONG_REGION = {
  "zh-hk": ["網路", "網際網路", "品質", "軟體", "計畫", "部落格", "影片", "行動電話"],
  "zh-tw": ["網絡", "互聯網", "質素", "軟件", "網誌", "短片", "手提電話", "甚麼"],
  "zh-cn": ["測驗", "網路", "質素", "軟體", "部落格", "互聯網"]
};

test("no locale uses another region's vocabulary", () => {
  CHINESE.forEach((loc) => {
    stringsOf(loc).forEach(([key, text]) => {
      WRONG_REGION[loc].forEach((word) => {
        assert.ok(text.indexOf(word) === -1,
          loc + " " + key + " uses the wrong-region word " + word + ": " + text);
      });
    });
  });
});

/* ---- house style ---- */

test("no dictionary string carries a percentage, a plus-minus, the word margin, or a dash", () => {
  /* The same rule test/types.test.js holds the English copy to. Chinese
     punctuation is full-width and needs no dash at all, so —— is refused here
     as deliberately as the em-dash is in English. */
  I18N.SUPPORTED.forEach((loc) => {
    stringsOf(loc).forEach(([key, text]) => {
      const where = loc + " " + key;
      assert.ok(!/\d+%/.test(text), where + " leaked a percentage");
      assert.ok(text.indexOf("±") === -1, where + " leaked a plus-minus");
      assert.ok(!/margin/i.test(text), where + " leaked the word margin");
      assert.ok(text.indexOf("—") === -1, where + " leaked an em-dash");
      assert.ok(text.indexOf("–") === -1, where + " leaked an en-dash");
    });
  });
});

test("every locale names all sixteen types, with no string left in English", () => {
  const codes = Object.keys(globalThis.SG.types.byCode).sort();
  CHINESE.forEach((loc) => {
    codes.forEach((code) => {
      const t = I18N.type(code, loc);
      assert.ok(/[㐀-䶿一-鿿]/.test(t.name), loc + " " + code + " has no Chinese name");
      assert.ok(/[㐀-䶿一-鿿]/.test(t.line), loc + " " + code + " has no Chinese line");
    });
  });
});

/* ---- staging ---- */

test("a locale is only complete once nothing in it still falls back to English", () => {
  /* meta.complete is what puts a locale in the sitemap, in the hreflang sets
     and in the switcher. It must never be true while the type prose is still
     English, which is what a reader would actually see. */
  const codes = Object.keys(globalThis.SG.types.byCode);
  const CJK = /[㐀-䶿一-鿿]/;
  CHINESE.forEach((loc) => {
    if (!I18N.isComplete(loc)) { return; }
    codes.forEach((code) => {
      const t = I18N.type(code, loc);
      ["opening", "best", "undone"].forEach((field) => {
        assert.ok(CJK.test(t[field]),
          loc + " is marked complete but " + code + "." + field + " is still English");
      });
      t.chips.forEach((chip) => assert.ok(CJK.test(chip),
        loc + " is marked complete but a " + code + " chip is still English"));
    });
    globalThis.SG.items.core.concat(globalThis.SG.items.tiebreak).forEach((item) => {
      /* Through the runtime, not off the English base. Reading item[item.show]
         here asked whether js/items.js was in Chinese, which it never will be,
         so no locale could ever have been marked complete. */
      assert.ok(CJK.test(I18N.statement(item, loc)),
        loc + " is marked complete but item " + item.id + " is still English");
    });
  });
});

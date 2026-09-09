(function (root) {
  "use strict";
  var SG = root.SG;

  /* zh-Hant-HK. Standard Written Chinese in Traditional characters with Hong
     Kong conventions, which is what Hong Kong newspapers, government and
     formal writing actually use. It is NOT written Cantonese.

     Register, enforced by test/locales.test.js:
       - None of 佢 咗 嘅 冇 睇 喺 嘢 嗰 乜 咁 唔. Written Cantonese fails.
       - Hong Kong word and glyph choices: 裏 over 裡, 着 over 著, 網絡 over
         網路, 質素 over 品質, 互聯網 over 網際網路, 甚麼 over 什麼.
       - Standard written grammar throughout: 他, 這, 沒有, 嗎, 很.

     Written by hand against js/locale-en.js. Never converted from
     js/locale-zh-tw.js: the two share a script and diverge on vocabulary,
     which is exactly what a converter cannot see.

     NOT YET READ BY A NATIVE HONG KONG READER. meta.complete stays false
     until that happens and until the type prose is written. */
  SG.i18n.register("zh-hk", {
    meta: { complete: false, offered: true },

    brand: "Personality",
    nav: { sixteen: "看十六型" },
    lang: { label: "語言", unfinished: "本頁翻譯尚未完成。" },

    intro: {
      eyebrow: "四個字母的性格測驗",
      title: "Personality",
      lede: "三十六條問題，七級評分。如果有兩種類型對你來說真的相近，我們會直接說出來，而不是猜一個給你。",
      start: "開始",
      note: "毋須帳戶。不會儲存。不會傳送到任何地方。"
    },

    question: {
      heading: "題目",
      /* Digits, not 三十六. Spelled-out numerals read as formal or archaic in
         Chinese where a digit reads as plain modern prose, which is the
         opposite of what the English words are doing. */
      progress: "已完成 {done} 題，尚餘 {left} 題",
      agree: "同意",
      disagree: "不同意",
      scaleLabel: "你有多同意這句話",
      back: "上一題",
      next: "下一題",
      finish: "查看結果"
    },

    feedback: {
      1: "非常同意",
      2: "同意",
      3: "有點同意",
      4: "兩者之間",
      5: "有點不同意",
      6: "不同意",
      7: "非常不同意"
    },

    reveal: {
      alsoIn: "也在你身上。",
      settle: "分個高下",
      keepBoth: "兩個都要",
      continue: "繼續"
    },

    type: {
      backToGallery: "返回十六型",
      best: "你最好的時候：{clause}",
      undone: "你撐不下去的時候：{clause}",
      oftenLabel: "常被歸入這一型",
      asterisk: "這些都是猜測，我們寧願直接說明。名單上沒有一個人真正做過官方測驗並公開結果。互聯網上每一份名人類型名單，包括我們這一份，都只是粉絲在為陌生人投票。當成這樣看就好。",
      ctaLine: "不肯定這是你？",
      takeTest: "開始測驗",
      shareLabel: "儲存一張載有你結果的卡片。",
      share: "分享你的卡片",
      restart: "重新開始"
    },

    sections: {
      good: "你擅長甚麼",
      snags: "甚麼會絆住你",
      closeUp: "近看",
      work: "在工作上",
      oneThing: "最要緊的一件事"
    },

    gallery: {
      back: "返回",
      title: "十六型全覽",
      note: "這裏不用顏色分型。名字和文字自會說明。"
    },

    seo: {
      rootTitle: "Personality 性格測驗",
      rootDescription: "一個四字母性格測驗，會告訴你結果裏還住着哪一個第二型。",
      title: "{name}（{code}）",
      description: "{line} {code} 近看是甚麼樣子，以及住在它裏面的第二型。"
    },

    /* The sixteen names are transcreated, not translated: the English names
       are images rather than descriptions, and an image has to be re-found in
       each language. 避風塘 is an ordinary written noun in Hong Kong and
       carries Safe Harbour exactly. 星期日下晝 was the obvious Slow Sunday
       and is Cantonese, so 星期日下午 stands in its place. */
    /* One string per item id, and only the pole that appears on screen. The
       other pole is a design record in js/items.js: it is how each item's
       opposite was checked, it never reaches a reader, and it stays English
       in every locale. */
    items: {
      EI1: "我要說出來，才想得通。",
      EI2: "一屋陌生人，對我來說是倒數計時。",
      EI3: "我在人群裏充電。",
      EI4: "談話中間靜下來，我不覺得有問題。",
      EI5: "想法只想到一半，我也會說出來。",
      EI6: "週末夠靜，就算過得好。",
      EI7: "電話響，我會接。",
      EI8: "一對一的時候，我最風趣。",
      EI9: "我很容易認識新朋友，而且經常認識。",
      SN1: "給我看實際存在的東西。",
      SN2: "給我一個大概，細節我自己補。",
      SN3: "可以查證的，我才相信。",
      SN4: "細節本身就令人滿足。",
      SN5: "我記得的是那件事的意思。",
      SN6: "行之有效的方法，只是起點。",
      SN7: "我形容事情，是照字面說。",
      SN8: "我的心思，通常已經在明年某處。",
      SN9: "說明書是用來跟從的。",
      TF1: "按事情本身的道理決定。",
      TF2: "被人喜歡，比正確重要。",
      TF3: "我先給誠實的答案。",
      TF4: "感受本身就是重點。",
      TF5: "我不同意的立場，我也講得出道理。",
      TF6: "公平，是要把人也計算在內。",
      TF7: "批評是有用的。",
      TF8: "誰對這個計劃不自在，我會察覺。",
      TF9: "講道理就能定案。",
      JP1: "現在定下來，然後繼續。",
      JP2: "有計劃，我才安心。",
      JP3: "我總是在最後一刻才完成。",
      JP4: "未做的決定，等於還有選擇。",
      JP5: "我喜歡知道星期六會是怎樣。",
      JP6: "寫一張清單，一天就這樣沒了。",
      JP7: "計劃改了，總是有點失落。",
      JP8: "我出發當天早上才收拾行李。",
      JP9: "做完，好過懸着。",
      "EI-t1": "派對再精彩，散場後我還想繼續。",
      "EI-t2": "我一個人對着紙，想得最清楚。",
      "EI-t3": "全場只有我在說話，我不介意。",
      "EI-t4": "要辦聚會，我會做主人。",
      "EI-t5": "一個人過週末，是難得的享受。",
      "EI-t6": "我會等人介紹。",
      "EI-t7": "在熱鬧的地方工作，我反而更好。",
      "EI-t8": "我寧願少數人真正認識我。",
      "SN-t1": "我寧願把它修好，而不是重新構想。",
      "SN-t2": "我先想它可以變成甚麼。",
      "SN-t3": "好主意，是現在就行得通的主意。",
      "SN-t4": "我會看說明書。",
      "SN-t5": "看得出規律，爭論就有結論。",
      "SN-t6": "我會留意這個場面令我想起甚麼。",
      "SN-t7": "說我務實，是讚美。",
      "SN-t8": "我寧願做得古怪一點。",
      "TF-t1": "朋友的主意不好，我會直接說。",
      "TF-t2": "有充分理由要打破的規則，本來就是壞規則。",
      "TF-t3": "有人說我錯了，我不會退縮。",
      "TF-t4": "準確固然好，和氣才是必需。",
      "TF-t5": "就算不受歡迎，我也會作那個決定。",
      "TF-t6": "我第一個問題是：誰會受傷害。",
      "TF-t7": "分析和現場氣氛之間，我信分析。",
      "TF-t8": "判斷沒有人情，只會更差。",
      "JP-t1": "日程表一片空白，我會不安。",
      "JP-t2": "我寧願等，也不想決定錯。",
      "JP-t3": "到期限那一刻，我才做完。",
      "JP-t4": "我先收拾好，才開始工作。",
      "JP-t5": "一成不變的生活會把我磨平。",
      "JP-t6": "訂餐廳的是我。",
      "JP-t7": "做到一半的事，只是暫停了。",
      "JP-t8": "我只要一張機票，其他不用。"
    },

    types: {
      ENFJ: { name: "暖鋒",       line: "他一進來，整個場面就鬆了下來。" },
      ENFP: { name: "野花",       line: "六個新計劃，每一個都是真心喜歡。" },
      ENTJ: { name: "全速",       line: "早就決定好了，只是還在跟你客氣。" },
      ENTP: { name: "擦出火花",   line: "會把你的論點還給你，而且說得比你好。" },
      ESFJ: { name: "黏合劑",     line: "沒有他，那個群組早就靜了。" },
      ESFP: { name: "加場",       line: "最後一個走，而那一晚因此更好。" },
      ESTJ: { name: "直線",       line: "最短的路線，說出來，還說兩次。" },
      ESTP: { name: "沒有剎車",   line: "先答應，細節從來不看。" },
      /* The voice sample. One type written end to end, in all three
         locales, so the register can be read and approved before the
         other fifteen are written against it. */
      INFJ: {
        name: "靜觀",
        line: "人還未進門，已經把整個場面看懂了。",
        opening: "你看人很準，而且通常沒有看錯，這是一份可愛的天賦，也是一份令人疲累的天賦。你走進大部分場合，早已看出誰不快樂、誰在裝作沒事，然後整個晚上默默地替他們打點，沒有人開口請你這樣做。",
        best: "有人終於把真話說出口，而你是第一個聽見的人。",
        undone: "替所有人做了一個月，卻沒有一個人問過你好不好。",
        chips: [
          "看得懂場面",
          "私下計劃",
          "很慢才信人",
          "記仇記得整齊",
          "忠誠得可怕"
        ],
        good: [
          "這個場面需要甚麼，你在場內任何人弄清楚問題之前就知道。這不是甚麼神奇本領。你從小就一直在看人的臉，而且在心裏存了一份很大的檔案，記錄人在沒有說真話的時候是甚麼樣子。",
          "因此你就是那個能夠開口談別人都在迴避的話題的人。你可以把難聽的話說得溫和，讓對方聽出來是關心而不是攻擊，這比你以為的稀有得多。人們會告訴你一些從未告訴過任何人的事，而且往往在認識你一小時之內。",
          "你另一項少見的本領，是能夠守住一個方向。大部分人只想要結果。你想要結果，同時心裏有一幅圖，知道當中每一個人要變成甚麼樣子才走得到那裏，而你有足夠耐性等下去。"
        ],
        snags: [
          "你看人通常都準，而「通常」這兩個字在這句話裏承擔了很多。你錯的時候，往往錯得非常肯定，因為那個判斷是以感覺的形式到達的，而感覺不會把推算過程攤開給你看。你會照着它行事好幾個月，才想起要查證。",
          "你也會把別人的情緒帶回家。下午三點一場緊張的會議，到晚上九點還壓在你胸口，而到那個時候，你已經認定那件事是衝着你來的。",
          "而且你不開口。你看得出每個人需要甚麼，安靜地遞上去，然後等別人也看見你。當別人沒有看見，你甚麼也不說。你選擇退開，而等到有人發現你已經走了，那個決定你在幾個星期之前就做好了。"
        ],
        closeUp: [
          "你親近的人不多，你也沒有打算要多。你有的那幾個，你會留住幾十年，而且知道一些他們早已忘記自己說過的事。",
          "你想要的並不完全是浪漫。你想要的是不用解釋就被理解。認識初期，你會花很長時間尋找證據，看這個人是否真的看得見你，而如果證據始終沒有出現，你離開的時候會平靜得出奇。",
          "你的失手之處，是你在沉默中記帳。你付出很多，從不提代價，然後某一天帳簿合上，而對方從來不知道有一本帳。第二個月就把話說出來。那比拖到第四年才說便宜得多。"
        ],
        work: [
          "你需要有意義的工作，和一道可以關上的門。開放式辦公室會把你真正擅長的東西，也就是對人和人之間關係的持續思考，磨成閒聊。",
          "你最好的工作發生在稍為看不見的地方：策略、那封難寫的電郵、那件沒有人想動筆的事。你往往是最清楚團隊裏真正發生甚麼事的人，也同樣往往不是任何人想到要問的那一個。",
          "小心照顧者的陷阱。因為你最快察覺到別人的不安，於是所有人的不安都交到你手上。那不在你的職責範圍，也沒有人在衡量它。"
        ],
        oneThing: [
          "那不是把人看得更準。你在這一項已經到頂。",
          "那是把你想要的東西，平白地、在你想要的時候說出來，在它變成怨氣之前。不是外交辭令的版本，是平白的版本。你花了一輩子替一些本來聽得懂直話的人做翻譯，而這份翻譯的全部代價都落在你身上。",
          "從小到不像對峙的地方開始。我不太想。我需要一天。那句話傷到我了。你會發現，大部分人只會說一聲好。"
        ]
      },
      INFP: { name: "柔焦",       line: "整個星期都在感受，到星期五才說出口。" },
      INTJ: { name: "深潭",       line: "想在三步之前，一步也不說出來。" },
      INTP: { name: "兔子洞",     line: "本來只是去查一件事，四個小時後才回來。" },
      ISFJ: { name: "避風塘",     line: "記得你的茶要怎樣沖，由 2019 年起。" },
      ISFP: { name: "星期日下午", line: "不是遲到，只是不趕。" },
      ISTJ: { name: "中流砥柱",   line: "說過會做，所以就一定會做。" },
      ISTP: { name: "拆解師",     line: "東西已經拆成一件件。不用慌。" }
    }
  });
}(typeof window !== "undefined" ? window : globalThis));

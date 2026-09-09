(function (root) {
  "use strict";
  var SG = root.SG;

  /* zh-Hant-TW. Traditional characters with Taiwan vocabulary and Taiwan
     grammar, which is a different locale from zh-Hant-HK and not a variant
     spelling of it.

     Taiwan choices, enforced by test/locales.test.js:
       - 什麼 over 甚麼, 裡 over 裏, 著 over 着.
       - 網路 over 網絡, 品質 over 質素, 軟體 over 軟件, 計畫 over 計劃.
       - 禮拜 and 影片 read Taiwanese; 星期 and 短片 read Hong Kong.
       - No written Cantonese, same as every other locale here.

     Written by hand against js/locale-en.js. Never converted from
     js/locale-zh-hk.js.

     NOT YET READ BY A NATIVE TAIWAN READER. meta.complete stays false until
     that happens and until the type prose is written. */
  SG.i18n.register("zh-tw", {
    meta: { complete: false, offered: true },

    brand: "Personality",
    nav: { sixteen: "看全部十六型" },
    lang: { label: "語言", unfinished: "這一頁的翻譯還沒完成。" },

    intro: {
      eyebrow: "四個字母的性格測驗",
      title: "Personality",
      lede: "三十六道題目，七點量表。如果有兩種類型對你來說真的很接近，我們會直說，而不是猜一個給你。",
      start: "開始",
      note: "不用註冊。不會儲存。不會傳送到任何地方。"
    },

    question: {
      heading: "題目",
      progress: "已完成 {done} 題，還剩 {left} 題",
      agree: "同意",
      disagree: "不同意",
      scaleLabel: "你有多同意這句話",
      back: "上一題",
      next: "下一題",
      finish: "看結果"
    },

    feedback: {
      1: "非常同意",
      2: "同意",
      3: "有點同意",
      4: "介於兩者之間",
      5: "有點不同意",
      6: "不同意",
      7: "非常不同意"
    },

    reveal: {
      alsoIn: "也在你身上。",
      settle: "分出高下",
      keepBoth: "兩個都要",
      continue: "繼續"
    },

    type: {
      backToGallery: "回到十六型",
      best: "你狀態最好的時候：{clause}",
      undone: "你會垮掉的時候：{clause}",
      oftenLabel: "常被歸為這一型",
      asterisk: "這些都是猜測，我們寧願講明。名單上沒有一個人真的做過官方測驗並公開結果。網路上每一份名人類型名單，包括我們這一份，都只是粉絲在替陌生人投票。就當成這樣看吧。",
      ctaLine: "不確定這是你嗎？",
      takeTest: "開始測驗",
      shareLabel: "儲存一張你的結果卡片。",
      share: "分享你的卡片",
      restart: "重新開始"
    },

    sections: {
      good: "你擅長什麼",
      snags: "什麼會卡住你",
      closeUp: "近看",
      work: "在職場上",
      oneThing: "最重要的那件事"
    },

    gallery: {
      back: "返回",
      title: "十六型",
      note: "這裡不用顏色分型。名字和文字自己會說話。"
    },

    seo: {
      rootTitle: "Personality 性格測驗",
      rootDescription: "一個四字母性格測驗，會告訴你結果裡還住著哪一個第二型。",
      title: "{name}（{code}）",
      description: "{line} {code} 近看是什麼樣子，以及住在它裡面的第二型。"
    },

    /* Transcreated, not translated, and written separately from the Hong Kong
       set. 安可 is what Taiwan calls an encore, borrowed straight from the
       word; Hong Kong says 加場 and the mainland says 返場. 煞車 is the Taiwan
       spelling of a brake, against 剎車 in Hong Kong and 刹车 on the
       mainland. */
    /* One string per item id, and only the pole that appears on screen. See
       js/locale-zh-hk.js for why the other pole stays English. */
    items: {
      EI1: "我要講出來，才想得通。",
      EI2: "一屋子陌生人，對我來說是倒數計時。",
      EI3: "我在人群裡充電。",
      EI4: "聊天聊到安靜下來，我覺得沒關係。",
      EI5: "想法只有一半，我也會講出來。",
      EI6: "週末夠安靜，就算過得好。",
      EI7: "電話響了，我會接。",
      EI8: "一對一的時候，我最好笑。",
      EI9: "我很容易認識新朋友，也常常認識。",
      SN1: "給我看真正存在的東西。",
      SN2: "給我一個輪廓，細節我自己補。",
      SN3: "能查得到的，我才相信。",
      SN4: "細節本身就讓人滿足。",
      SN5: "我記得的是那件事的意義。",
      SN6: "已經證明可行的方法，只是起點。",
      SN7: "我描述事情，就照字面講。",
      SN8: "我的心思，通常已經跑到明年了。",
      SN9: "說明書就是拿來照著做的。",
      TF1: "就事論事來決定。",
      TF2: "被喜歡比正確重要。",
      TF3: "我會先講實話。",
      TF4: "感受才是重點。",
      TF5: "我不同意的立場，我也能替它說話。",
      TF6: "公平，是要把人也考慮進去。",
      TF7: "被批評是好事。",
      TF8: "誰對這個計畫不自在，我看得出來。",
      TF9: "邏輯說了算。",
      JP1: "現在就定案，然後往下走。",
      JP2: "有計畫，我才安心。",
      JP3: "我總是拖到最後一刻才做完。",
      JP4: "還沒決定，就還有得選。",
      JP5: "我喜歡知道禮拜六要做什麼。",
      JP6: "列一張清單，一天就這樣沒了。",
      JP7: "計畫變了，總會有點失落。",
      JP8: "我出發當天早上才打包。",
      JP9: "做完，好過懸著。",
      "EI-t1": "派對再精彩，散場後我還想再續攤。",
      "EI-t2": "我一個人對著紙，想得最清楚。",
      "EI-t3": "全場只有我在講話，我也不介意。",
      "EI-t4": "要辦聚會，我會當主人。",
      "EI-t5": "自己一個人過週末，我求之不得。",
      "EI-t6": "我會等別人介紹。",
      "EI-t7": "在熱鬧的地方工作，我反而更有效率。",
      "EI-t8": "我寧願被少數人真正認識。",
      "SN-t1": "我寧願把它修好，而不是重新想過。",
      "SN-t2": "我先想它可以變成什麼。",
      "SN-t3": "好點子，是現在就行得通的點子。",
      "SN-t4": "說明書我會從頭看完。",
      "SN-t5": "找到規律，爭論就結束了。",
      "SN-t6": "我會注意這個場景讓我想起什麼。",
      "SN-t7": "說我務實，是稱讚。",
      "SN-t8": "我寧願做得奇怪一點。",
      "TF-t1": "朋友的點子不好，我會直接講。",
      "TF-t2": "有好理由必須打破的規則，本來就是壞規則。",
      "TF-t3": "被說錯了，我不會退縮。",
      "TF-t4": "正確固然好，和氣才是必要。",
      "TF-t5": "就算不受歡迎，我也會做那個決定。",
      "TF-t6": "我第一個問題是：這會傷到誰。",
      "TF-t7": "分析和現場氣氛之間，我相信分析。",
      "TF-t8": "判斷少了人情味，只會更糟。",
      "JP-t1": "行事曆一片空白，我會不安。",
      "JP-t2": "我寧願等，也不要決定錯。",
      "JP-t3": "期限到了，我才會做完。",
      "JP-t4": "我會先整理，才開始工作。",
      "JP-t5": "太規律的生活會把我磨鈍。",
      "JP-t6": "餐廳都是我訂的。",
      "JP-t7": "做到一半的事，只是暫停而已。",
      "JP-t8": "我只要一張機票，其他都不用。"
    },

    types: {
      ENFJ: { name: "暖鋒",       line: "他一走進來，整個場子就輕鬆了。" },
      ENFP: { name: "野花",       line: "六個新計畫，而且每一個都真心喜歡。" },
      ENTJ: { name: "油門到底",   line: "早就決定了，只是還在跟你客氣。" },
      ENTP: { name: "火花四濺",   line: "會把你的論點反過來講給你聽，而且講得更好。" },
      ESFJ: { name: "黏著劑",     line: "沒有他，那個群組早就沒人講話了。" },
      ESFP: { name: "安可",       line: "最後一個離開，那一晚也因此更好玩。" },
      ESTJ: { name: "一條直線",   line: "最短的路線，講出來，而且講兩次。" },
      ESTP: { name: "沒有煞車",   line: "先說好，細節從來不看。" },
      /* The voice sample. One type written end to end, in all three
         locales, so the register can be read and approved before the
         other fifteen are written against it. */
      INFJ: {
        name: "安靜地讀",
        line: "人還沒進門，就已經把整個場子看懂了。",
        opening: "你看人很快，而且通常都對，這是一份美好的天賦，也是一份讓人疲憊的天賦。你走進大部分場合，早就已經看出誰不開心、誰在假裝沒事，然後整個晚上默默地幫他們處理，也沒有人開口拜託你。",
        best: "有人終於把真心話講出口，而你是第一個聽見的人。",
        undone: "幫所有人做了一個月，卻沒有半個人問過你好不好。",
        chips: [
          "看得懂場子",
          "私下規劃",
          "很慢才信任人",
          "記仇記得整齊",
          "忠誠得嚇人"
        ],
        good: [
          "這個場子需要什麼，你在場內任何人搞清楚問題之前就知道了。這不是什麼神奇能力。你從小就一直在看人的臉，而且在心裡存了一份很大的檔案，記著人在沒講真話的時候是什麼樣子。",
          "所以你就是那個能夠開口談別人都在迴避的話題的人。你可以把難聽的話講得溫和，讓對方聽出來是關心而不是攻擊，這比你以為的稀有得多。人們會告訴你一些從來沒告訴過任何人的事，而且常常是在認識你一小時之內。",
          "你還有一項少見的本事，是能夠守住一個方向。大部分人只要結果。你要結果，同時心裡有一幅圖，知道其中每一個人要變成什麼樣子才走得到那裡，而你有足夠的耐心等下去。"
        ],
        snags: [
          "你看人通常都對，而「通常」這兩個字在這句話裡承擔了很多。你錯的時候，往往錯得非常肯定，因為那個判斷是以感覺的形式出現的，而感覺不會把推理過程攤開給你看。你會照著它做好幾個月，才想到要查證。",
          "你也會把別人的情緒帶回家。下午三點一場緊繃的會議，到晚上九點還壓在你胸口，而到那個時候，你已經認定那件事是衝著你來的。",
          "而且你不開口。你看得出每個人需要什麼，安靜地遞過去，然後等別人也看見你。當別人沒看見，你什麼也不說。你選擇退開，而等到有人發現你已經走了，那個決定你在幾個禮拜前就做好了。"
        ],
        closeUp: [
          "你親近的人不多，你也沒打算要多。你有的那幾個，你會留幾十年，而且知道一些他們早就忘記自己講過的事。",
          "你想要的並不完全是浪漫。你想要的是不用解釋就被懂。認識初期，你會花很長時間找證據，看這個人是不是真的看得見你，而如果證據始終沒出現，你離開的時候會平靜得出奇。",
          "你會失手的地方，是你在沉默裡記帳。你付出很多，從不提代價，然後某一天帳本闔上，而對方從來不知道有這本帳。第二個月就把話講出來。那比拖到第四年才講便宜得多。"
        ],
        work: [
          "你需要有意義的工作，和一扇關得起來的門。開放式辦公室會把你真正擅長的東西，也就是對人跟人之間如何組合的持續思考，磨成閒聊。",
          "你最好的工作發生在稍微看不見的地方：策略、那封難寫的信、那件沒人想動筆的事。你常常是最清楚團隊裡真正在發生什麼事的人，也同樣常常不是任何人想到要問的那一個。",
          "小心照顧者的陷阱。因為你最快察覺到別人的不安，於是所有人的不安都被交到你手上。那不在你的職務說明裡，也沒有人在衡量它。"
        ],
        oneThing: [
          "那不是把人看得更準。你在這一項已經到頂了。",
          "那是把你想要的東西，直白地、在你想要的時候講出來，在它變成怨氣之前。不是外交辭令的版本，是直白的版本。你花了一輩子替一些本來聽得懂直話的人做翻譯，而這份翻譯的代價全部落在你身上。",
          "從小到不像對峙的地方開始。我不太想。我需要一天。那句話傷到我了。你會發現，大部分人只會說一聲好。"
        ]
      },
      INFP: { name: "柔焦",       line: "整個禮拜都在感覺，到禮拜五才講出來。" },
      INTJ: { name: "靜水流深",   line: "想在三步之前，一步都不說。" },
      INTP: { name: "無底洞",     line: "本來只是去查一件事，一去四個鐘頭。" },
      ISFJ: { name: "港灣",       line: "記得你的茶要怎麼泡，從 2019 年開始。" },
      ISFP: { name: "慢星期天",   line: "不是遲到，只是不趕。" },
      ISTJ: { name: "棟樑",       line: "說過會做，那就一定會做。" },
      ISTP: { name: "修理工",     line: "東西已經拆成一堆零件。別緊張。" }
    }
  });
}(typeof window !== "undefined" ? window : globalThis));

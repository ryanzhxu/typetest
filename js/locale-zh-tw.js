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
    meta: { complete: false },

    brand: "Personality",
    nav: { sixteen: "看全部十六型" },
    lang: { label: "語言" },

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
      best: "你最好的狀態：{clause}",
      undone: "你亂了套的時候：{clause}",
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
    types: {
      ENFJ: { name: "暖鋒",       line: "他一走進來，整個場子就輕鬆了。" },
      ENFP: { name: "野花",       line: "六個新計畫，而且每一個都真心喜歡。" },
      ENTJ: { name: "油門到底",   line: "早就決定了，只是還在跟你客氣。" },
      ENTP: { name: "火花四濺",   line: "會把你的論點反過來講給你聽，而且講得更好。" },
      ESFJ: { name: "黏著劑",     line: "沒有他，那個群組早就沒人講話了。" },
      ESFP: { name: "安可",       line: "最後一個離開，那一晚也因此更好玩。" },
      ESTJ: { name: "一條直線",   line: "最短的路線，講出來，而且講兩次。" },
      ESTP: { name: "沒有煞車",   line: "先說好，細節從來不看。" },
      INFJ: { name: "安靜地讀",   line: "人還沒進門，就已經把整個場子看懂了。" },
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

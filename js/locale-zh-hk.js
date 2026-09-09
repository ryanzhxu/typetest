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
      best: "你最好的狀態：{clause}",
      undone: "你亂了陣腳的時候：{clause}",
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
    types: {
      ENFJ: { name: "暖鋒",       line: "他一進來，整個場面就鬆了下來。" },
      ENFP: { name: "野花",       line: "六個新計劃，每一個都是真心喜歡。" },
      ENTJ: { name: "全速",       line: "早就決定好了，只是還在跟你客氣。" },
      ENTP: { name: "擦出火花",   line: "會把你的論點還給你，而且說得比你好。" },
      ESFJ: { name: "黏合劑",     line: "沒有他，那個群組早就靜了。" },
      ESFP: { name: "加場",       line: "最後一個走，而那一晚因此更好。" },
      ESTJ: { name: "直線",       line: "最短的路線，說出來，還說兩次。" },
      ESTP: { name: "沒有剎車",   line: "先答應，細節從來不看。" },
      INFJ: { name: "靜觀",       line: "人還未進門，已經把整個場面看懂了。" },
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

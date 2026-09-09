(function (root) {
  "use strict";
  var SG = root.SG;

  /* zh-Hans-CN. Simplified characters with mainland vocabulary.

     Mainland choices, enforced by test/locales.test.js:
       - 测试 over 測驗, 视频 over 影片, 质量 over 質素/品質, 网络 over 網路.
       - 简历 over 履歷, 源代码 over 原始碼, 分辨率 over 解像度/解析度.
       - No Traditional characters anywhere, and no written Cantonese.

     Written by hand against js/locale-en.js. This file is NOT a glyph
     conversion of either Traditional file, and must never become one: a
     converter turns 履歷 into 履历, where the Simplified word is 简历.

     NOT YET READ BY A NATIVE MAINLAND READER. meta.complete stays false until
     that happens and until the type prose is written. */
  SG.i18n.register("zh-cn", {
    meta: { complete: false, offered: true },

    brand: "Personality",
    nav: { sixteen: "看全部十六型" },
    lang: { label: "语言", unfinished: "本页翻译尚未完成。" },

    intro: {
      eyebrow: "四个字母的性格测试",
      title: "Personality",
      lede: "三十六道题，七级评分。如果有两种类型对你来说真的很接近，我们会直接说出来，而不是猜一个给你。",
      start: "开始",
      note: "无需账号。不保存。不发送到任何地方。"
    },

    question: {
      heading: "题目",
      progress: "已完成 {done} 题，还剩 {left} 题",
      agree: "同意",
      disagree: "不同意",
      scaleLabel: "你有多同意这句话",
      back: "上一题",
      next: "下一题",
      finish: "查看结果"
    },

    feedback: {
      1: "非常同意",
      2: "同意",
      3: "有点同意",
      4: "介于两者之间",
      5: "有点不同意",
      6: "不同意",
      7: "非常不同意"
    },

    reveal: {
      alsoIn: "也在你身上。",
      settle: "决出高下",
      keepBoth: "两个都要",
      continue: "继续"
    },

    type: {
      backToGallery: "返回十六型",
      best: "你最好的状态：{clause}",
      undone: "你乱掉的时候：{clause}",
      oftenLabel: "常被归为这一型",
      asterisk: "这些都是猜测，我们宁愿直说。名单上没有一个人真的做过官方测试并公开结果。互联网上每一份名人类型名单，包括我们这一份，都只是粉丝在替陌生人投票。当成这样看就好。",
      ctaLine: "不确定这是你吗？",
      takeTest: "开始测试",
      shareLabel: "保存一张你的结果卡片。",
      share: "分享你的卡片",
      restart: "重新开始"
    },

    sections: {
      good: "你擅长什么",
      snags: "什么会绊住你",
      closeUp: "近看",
      work: "在工作中",
      oneThing: "最重要的那一件事"
    },

    gallery: {
      back: "返回",
      title: "十六型全览",
      note: "这里不用颜色分型。名字和文字自己会说话。"
    },

    seo: {
      rootTitle: "Personality 性格测试",
      rootDescription: "一个四字母性格测试，会告诉你结果里还住着哪一个第二类型。",
      title: "{name}（{code}）",
      description: "{line} {code} 近看是什么样子，以及住在它里面的第二类型。"
    },

    /* Transcreated, not translated, and written separately from both
       Traditional sets. 返场 is the mainland word for an encore, against 加場
       in Hong Kong and 安可 in Taiwan. A group chat is 群 on the mainland and
       群組 in both Traditional locales. */
    types: {
      ENFJ: { name: "暖锋",       line: "他一进门，整个场面就松弛下来。" },
      ENFP: { name: "野花",       line: "六个新计划，每一个都真心喜欢。" },
      ENTJ: { name: "全速前进",   line: "早就定了，只是还在跟你客气。" },
      ENTP: { name: "火花四溅",   line: "会把你的观点还给你，而且说得比你更好。" },
      ESFJ: { name: "粘合剂",     line: "没有他，那个群早就沉了。" },
      ESFP: { name: "返场",       line: "最后一个走，那一晚也因此更尽兴。" },
      ESTJ: { name: "直线",       line: "最短的那条路，说出来，还说两遍。" },
      ESTP: { name: "不踩刹车",   line: "先答应，细节从来不看。" },
      INFJ: { name: "静观者",     line: "人还没进门，就已经把整个场面看懂了。" },
      INFP: { name: "柔焦",       line: "一整周都在感受，到周五才说出口。" },
      INTJ: { name: "深水静流",   line: "想在三步之前，一步也不说。" },
      INTP: { name: "兔子洞",     line: "本来只是去查一件事，一去四个小时。" },
      ISFJ: { name: "避风港",     line: "记得你的茶要怎么泡，从 2019 年起。" },
      ISFP: { name: "慢周日",     line: "不是迟到，只是不着急。" },
      ISTJ: { name: "顶梁柱",     line: "说过会做，那就一定会做。" },
      ISTP: { name: "拆解者",     line: "东西已经拆成一堆零件。别慌。" }
    }
  });
}(typeof window !== "undefined" ? window : globalThis));

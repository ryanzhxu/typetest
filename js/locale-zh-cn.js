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
      best: "你状态最好的时候：{clause}",
      undone: "你会垮掉的时候：{clause}",
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
    /* One string per item id, and only the pole that appears on screen. See
       js/locale-zh-hk.js for why the other pole stays English. */
    items: {
      EI1: "我得说出来，才想得明白。",
      EI2: "一屋子陌生人，对我来说是倒计时。",
      EI3: "我在人群里充电。",
      EI4: "聊天中间冷场，我觉得没什么。",
      EI5: "想法只想到一半，我也会说出来。",
      EI6: "周末够安静，就算过得好。",
      EI7: "电话响了，我会接。",
      EI8: "一对一的时候，我最有意思。",
      EI9: "我很容易认识新朋友，也常常认识。",
      SN1: "给我看实际存在的东西。",
      SN2: "给我一个轮廓，细节我自己填。",
      SN3: "能查证的，我才相信。",
      SN4: "细节本身就让人满足。",
      SN5: "我记得的是那件事的意思。",
      SN6: "已经证明可行的方法，只是起点。",
      SN7: "我描述事情，就照字面说。",
      SN8: "我的心思，通常已经跑到明年了。",
      SN9: "说明书就是拿来照着做的。",
      TF1: "就事论事地决定。",
      TF2: "被人喜欢比正确更重要。",
      TF3: "我会先说实话。",
      TF4: "感受才是重点。",
      TF5: "我不同意的立场，我也能替它说话。",
      TF6: "公平，是要把人也考虑进去。",
      TF7: "批评是有用的。",
      TF8: "谁对这个计划不自在，我看得出来。",
      TF9: "逻辑说了算。",
      JP1: "现在就定下来，然后往下走。",
      JP2: "有计划，我才安心。",
      JP3: "我总是拖到最后一刻才做完。",
      JP4: "还没决定，就还有得选。",
      JP5: "我喜欢知道周六有什么安排。",
      JP6: "列一张清单，一天就这么没了。",
      JP7: "计划变了，总会有点失落。",
      JP8: "我出发当天早上才收拾行李。",
      JP9: "做完，好过悬着。",
      "EI-t1": "派对再尽兴，散场后我还想再来一场。",
      "EI-t2": "我一个人对着纸，想得最清楚。",
      "EI-t3": "全场只有我在说话，我也不介意。",
      "EI-t4": "要办聚会，我会当主人。",
      "EI-t5": "一个人过周末，我求之不得。",
      "EI-t6": "我会等别人介绍。",
      "EI-t7": "在热闹的地方工作，我反而更有效率。",
      "EI-t8": "我宁愿被少数人真正认识。",
      "SN-t1": "我宁愿把它修好，而不是重新想过。",
      "SN-t2": "我先想它可以变成什么。",
      "SN-t3": "好主意，是现在就行得通的主意。",
      "SN-t4": "说明书我会从头看完。",
      "SN-t5": "找到规律，争论就结束了。",
      "SN-t6": "我会注意这个场面让我想起什么。",
      "SN-t7": "说我务实，是夸奖。",
      "SN-t8": "我宁愿做得古怪一点。",
      "TF-t1": "朋友的主意不好，我会直接说。",
      "TF-t2": "有充分理由必须打破的规则，本来就是坏规则。",
      "TF-t3": "被说错了，我不会退缩。",
      "TF-t4": "准确固然好，和气才是必要的。",
      "TF-t5": "就算不受欢迎，我也会做那个决定。",
      "TF-t6": "我第一个问题是：这会伤到谁。",
      "TF-t7": "分析和现场气氛之间，我信分析。",
      "TF-t8": "判断少了人情味，只会更糟。",
      "JP-t1": "日程表一片空白，我会不安。",
      "JP-t2": "我宁愿等，也不想决定错。",
      "JP-t3": "到了截止那一刻，我才做完。",
      "JP-t4": "我会先收拾，才开始工作。",
      "JP-t5": "一成不变的生活会把我磨平。",
      "JP-t6": "餐厅都是我订的。",
      "JP-t7": "做到一半的事，只是暂停而已。",
      "JP-t8": "我只要一张机票，其他都不用。"
    },

    types: {
      ENFJ: { name: "暖锋",       line: "他一进门，整个场面就松弛下来。" },
      ENFP: { name: "野花",       line: "六个新计划，每一个都真心喜欢。" },
      ENTJ: { name: "全速前进",   line: "早就定了，只是还在跟你客气。" },
      ENTP: { name: "火花四溅",   line: "会把你的观点还给你，而且说得比你更好。" },
      ESFJ: { name: "粘合剂",     line: "没有他，那个群早就沉了。" },
      ESFP: { name: "返场",       line: "最后一个走，那一晚也因此更尽兴。" },
      ESTJ: { name: "直线",       line: "最短的那条路，说出来，还说两遍。" },
      ESTP: { name: "不踩刹车",   line: "先答应，细节从来不看。" },
      /* The voice sample. One type written end to end, in all three
         locales, so the register can be read and approved before the
         other fifteen are written against it. */
      INFJ: {
        name: "静观者",
        line: "人还没进门，就已经把整个场面看懂了。",
        opening: "你看人很快，而且通常都对，这是一份美好的天赋，也是一份让人疲惫的天赋。你走进大部分场合，早就看出谁不开心、谁在假装没事，然后整个晚上默默地替他们打点，也没有人开口拜托你。",
        best: "有人终于把真心话说出口，而你是第一个听见的人。",
        undone: "替所有人做了一个月，却没有一个人问过你好不好。",
        chips: [
          "看得懂场面",
          "私下规划",
          "很慢才信任人",
          "记仇记得整齐",
          "忠诚得吓人"
        ],
        good: [
          "这个场面需要什么，你在场内任何人弄清楚问题之前就知道了。这不是什么神奇能力。你从小就一直在看人的脸，而且在心里存了一份很大的档案，记着人在没说真话的时候是什么样子。",
          "所以你就是那个能开口谈别人都在回避的话题的人。你可以把难听的话说得温和，让对方听出来是关心而不是攻击，这比你以为的稀有得多。人们会告诉你一些从来没告诉过任何人的事，而且常常是在认识你一小时之内。",
          "你还有一项少见的本事，是能守住一个方向。大部分人只要结果。你要结果，同时心里有一幅图，知道其中每一个人要变成什么样子才走得到那里，而你有足够的耐心等下去。"
        ],
        snags: [
          "你看人通常都对，而“通常”这两个字在这句话里承担了很多。你错的时候，往往错得非常肯定，因为那个判断是以感觉的形式出现的，而感觉不会把推理过程摊开给你看。你会照着它做好几个月，才想到要查证。",
          "你也会把别人的情绪带回家。下午三点一场紧绷的会议，到晚上九点还压在你胸口，而到那个时候，你已经认定那件事是冲着你来的。",
          "而且你不开口。你看得出每个人需要什么，安静地递过去，然后等别人也看见你。当别人没看见，你什么也不说。你选择退开，而等到有人发现你已经走了，那个决定你在几周前就做好了。"
        ],
        closeUp: [
          "你亲近的人不多，你也没打算要多。你有的那几个，你会留几十年，而且知道一些他们早就忘记自己说过的事。",
          "你想要的并不完全是浪漫。你想要的是不用解释就被懂。认识初期，你会花很长时间找证据，看这个人是不是真的看得见你，而如果证据始终没出现，你离开的时候会平静得出奇。",
          "你会失手的地方，是你在沉默里记账。你付出很多，从不提代价，然后某一天账本合上，而对方从来不知道有这本账。第二个月就把话说出来。那比拖到第四年才说便宜得多。"
        ],
        work: [
          "你需要有意义的工作，和一扇关得上的门。开放式办公室会把你真正擅长的东西，也就是对人和人之间如何组合的持续思考，磨成闲聊。",
          "你最好的工作发生在稍微看不见的地方：策略、那封难写的邮件、那件没人想动笔的事。你常常是最清楚团队里真正在发生什么的人，也同样常常不是任何人想到要问的那一个。",
          "小心照顾者的陷阱。因为你最快察觉到别人的不安，于是所有人的不安都被交到你手上。那不在你的职责范围里，也没有人在衡量它。"
        ],
        oneThing: [
          "那不是把人看得更准。你在这一项已经到顶了。",
          "那是把你想要的东西，直白地、在你想要的时候说出来，在它变成怨气之前。不是外交辞令的版本，是直白的版本。你花了一辈子替一些本来听得懂直话的人做翻译，而这份翻译的代价全部落在你身上。",
          "从小到不像对峙的地方开始。我不太想。我需要一天。那句话伤到我了。你会发现，大部分人只会说一声好。"
        ]
      },
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

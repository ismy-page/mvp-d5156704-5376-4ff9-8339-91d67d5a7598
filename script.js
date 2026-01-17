(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const btn = document.getElementById("ctaButton");
  const out = document.getElementById("ctaResult");
  if (btn && out) {
    btn.addEventListener("click", () => {
      out.textContent = "Lovely choice. Now tailor the words and colors to your story.";
    });
  }

  // Interactive simulation: beauty advisory trainer
  const scenarioSelect = document.getElementById("scenarioSelect");
  const customerPrompt = document.getElementById("customerPrompt");
  const advisorInput = document.getElementById("advisorInput");
  const trainerFeedback = document.getElementById("trainerFeedback");
  const scoreEmpathy = document.getElementById("scoreEmpathy");
  const scoreQuestions = document.getElementById("scoreQuestions");
  const scoreProduct = document.getElementById("scoreProduct");
  const charCount = document.getElementById("charCount");
  const suggestBtn = document.getElementById("suggestBtn");

  if (
    scenarioSelect &&
    customerPrompt &&
    advisorInput &&
    trainerFeedback &&
    scoreEmpathy &&
    scoreQuestions &&
    scoreProduct &&
    charCount &&
    suggestBtn
  ) {
    /** @type {Record<string, {prompt: string; suggest: string; keywords: Record<string, number>}>} */
    const scenarios = {
      skincare_beginner: {
        prompt:
          "Hi! I’m just getting into skincare. My skin is a bit sensitive and I want a simple routine. Any advice?",
        suggest:
          "Thanks for sharing! To keep it gentle, I’d suggest a simple 3‑step routine: a fragrance‑free cleanser, a hydrating moisturizer with hyaluronic acid, and daily SPF 30+ sunscreen. How does your skin usually react to new products? We can patch‑test and adjust together.",
        keywords: {
          spf: 2,
          sunscreen: 2,
          cleanser: 1,
          gentle: 1,
          "fragrance-free": 1,
          moisturizer: 1,
          "hyaluronic": 1,
          "patch-test": 1,
        },
      },
      makeup_shade: {
        prompt:
          "I can’t find a foundation that matches my undertone. Everything looks too pink or too yellow—help!",
        suggest:
          "Great question. Let’s find your undertone together—do your veins look more blue/purple (cool) or green (warm)? I recommend testing 2–3 shades along the jawline and checking in natural light. We can also try a neutral undertone and adjust with concealer or setting powder.",
        keywords: {
          "shade match": 2,
          undertone: 2,
          "natural light": 1,
          foundation: 1,
          concealer: 1,
          neutral: 1,
          swatch: 1,
        },
      },
      hair_frizz: {
        prompt:
          "My colored hair gets frizzy and dull by the end of the week. What would help without stripping color?",
        suggest:
          "I hear you—color care can be tricky. I suggest a sulfate‑free shampoo, a color‑protect conditioner, and a weekly nourishing mask. Adding a heat protectant and a lightweight anti‑frizz serum before styling can help shine last longer. How often do you heat‑style?",
        keywords: {
          "sulfate-free": 2,
          "color-protect": 1,
          mask: 1,
          "heat protectant": 2,
          serum: 1,
          frizz: 1,
          shine: 1,
        },
      },
    };

    /** Simple evaluation logic to provide coaching */
    const empathyPhrases = [
      "i understand",
      "i hear",
      "i appreciate",
      "thanks for sharing",
      "that makes sense",
      "great question",
      "happy to help",
      "no worries",
      "let’s",
      "let's",
    ];

    const nextStepPhrases = [
      "i recommend",
      "i suggest",
      "you can",
      "let’s",
      "let's",
      "next",
      "try",
    ];

    const openQuestionWords = ["how", "what", "which", "where", "when", "tell me", "could you", "would you"];

    function normalize(s) {
      return s.toLowerCase();
    }

    function countMatches(text, list) {
      const t = normalize(text);
      let count = 0;
      for (let i = 0; i < list.length; i++) {
        if (t.indexOf(list[i]) !== -1) count++;
      }
      return count;
    }

    function countKeywordWeights(text, weights) {
      const t = normalize(text);
      let score = 0;
      for (const k in weights) {
        if (Object.prototype.hasOwnProperty.call(weights, k)) {
          if (t.indexOf(k) !== -1) score += weights[k];
        }
      }
      return score;
    }

    function countOpenQuestions(text) {
      const t = normalize(text);
      let count = 0;
      const qm = (text.match(/\?/g) || []).length;
      count += qm;
      for (let i = 0; i < openQuestionWords.length; i++) {
        if (t.indexOf(openQuestionWords[i]) !== -1) count++;
      }
      return count;
    }

    function hasNextStep(text) {
      return countMatches(text, nextStepPhrases) > 0;
    }

    function complianceWarnings(text) {
      const issues = [];
      if (/(cure|heal|prescription|diagnose|medical)/i.test(text)) {
        issues.push("Avoid medical claims—focus on cosmetic benefits and comfort.");
      }
      if (/(guarantee|100%)/i.test(text)) {
        issues.push("Avoid absolute guarantees—set realistic expectations.");
      }
      return issues;
    }

    function maxProductScore(weights) {
      let max = 0;
      for (const k in weights) {
        if (Object.prototype.hasOwnProperty.call(weights, k)) max += Math.max(1, weights[k]);
      }
      // Normalize to max 5
      return Math.max(5, Math.min(8, max));
    }

    function evaluate(text, scenarioKey) {
      const sc = scenarios[scenarioKey];
      const empathyRaw = countMatches(text, empathyPhrases);
      const empathy = Math.max(0, Math.min(5, empathyRaw));

      const questions = countOpenQuestions(text);

      const productRaw = countKeywordWeights(text, sc.keywords);
      const productMax = maxProductScore(sc.keywords);
      const product = Math.max(0, Math.min(5, Math.round((productRaw / productMax) * 5)));

      const nextStep = hasNextStep(text);
      const length = text.trim().length;

      const notes = [];
      if (empathy < 2) notes.push("Open with empathy (e.g., ‘I understand’ or ‘Great question’).");
      if (questions < 1) notes.push("Ask an open‑ended question to learn more.");
      if (product < 2) notes.push("Add product specifics relevant to the concern.");
      if (!nextStep) notes.push("Offer a clear next step (e.g., ‘I recommend…’ or ‘Let’s try…’).");
      if (length < 80) notes.push("Add a bit more detail to build trust.");
      if (length > 280) notes.push("Keep it concise—aim for under 280 characters.");

      const compliance = complianceWarnings(text);
      for (let i = 0; i < compliance.length; i++) notes.push(compliance[i]);

      return { empathy, questions, product, notes };
    }

    function renderFeedback(res) {
      trainerFeedback.textContent =
        res.notes.length > 0
          ? "Coach: " + res.notes[0]
          : "Nice balance—empathetic, curious, and specific. Great job!";
      scoreEmpathy.textContent = String(res.empathy);
      scoreQuestions.textContent = String(res.questions);
      scoreProduct.textContent = String(res.product);
    }

    function syncCharCount() {
      charCount.textContent = advisorInput.value.length + "/" + advisorInput.maxLength;
    }

    function setScenario(key) {
      const sc = scenarios[key];
      customerPrompt.textContent = sc.prompt;
      advisorInput.value = "";
      syncCharCount();
      renderFeedback({ empathy: 0, questions: 0, product: 0, notes: ["Start typing to see coaching tips…"] });
    }

    // Wire up events
    scenarioSelect.addEventListener("change", () => setScenario(String(scenarioSelect.value)));

    advisorInput.addEventListener("input", () => {
      syncCharCount();
      const res = evaluate(advisorInput.value, String(scenarioSelect.value));
      renderFeedback(res);
    });

    suggestBtn.addEventListener("click", () => {
      const sc = scenarios[String(scenarioSelect.value)];
      advisorInput.value = sc.suggest;
      syncCharCount();
      const res = evaluate(advisorInput.value, String(scenarioSelect.value));
      renderFeedback(res);
      advisorInput.focus();
    });

    // Initialize defaults
    setScenario(String(scenarioSelect.value || "skincare_beginner"));
  }
})();


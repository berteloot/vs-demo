// VoiceStream form: submit handler
(function () {
  "use strict";

  document.getElementById("yr").textContent = new Date().getFullYear();

  // Webhook target. Override via <meta name="vs-endpoint" content="..."> if needed.
  const meta = document.querySelector('meta[name="vs-endpoint"]');
  const ENDPOINT =
    (meta && meta.content) ||
    "https://webhook.altilead.com/webhook/voicestream-form";

  const form = document.getElementById("vs-form");
  const msg = document.getElementById("form-msg");
  const btn = form.querySelector("button[type='submit']");
  const btnLabel = btn.querySelector(".btn-label");
  const originalBtnText = btnLabel.textContent;

  function setMsg(text, kind) {
    msg.textContent = text;
    msg.className = "form-msg " + (kind || "");
  }

  function setLoading(loading) {
    btn.disabled = loading;
    btnLabel.textContent = loading ? "Sending…" : originalBtnText;
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value || "");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    setMsg("", "");

    const data = new FormData(form);
    const useCases = data.getAll("use_case");
    const comment = (data.get("comment") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();

    if (!validEmail(email)) {
      setMsg("That email doesn't look right. Mind double-checking?", "error");
      return;
    }
    if (useCases.length === 0 && !comment) {
      setMsg("Pick at least one option, or tell us in the comment.", "error");
      return;
    }

    setLoading(true);

    const payload = {
      email: email,
      use_cases: useCases,
      comment: comment,
      source: "voicestream-landing",
      submitted_at: new Date().toISOString(),
      page: window.location.href,
      referrer: document.referrer || null,
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error("HTTP " + res.status + (txt ? ": " + txt : ""));
      }

      form.reset();
      setMsg(
        "Got it. Stan is recording a short personalized reply right now. Check your inbox in a few minutes.",
        "success"
      );
    } catch (err) {
      console.error("VoiceStream form error:", err);
      setMsg(
        "Something went sideways on our end. Try again in a minute, or email stan@berteloot.org directly.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  });
})();

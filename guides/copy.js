for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    const content = document.getElementById(button.dataset.copy);
    try {
      await navigator.clipboard.writeText(content.textContent);
      button.textContent = "Copied";
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(content);
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = "Select and copy";
    }
  });
}

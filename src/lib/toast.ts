export const toast = (title: string, body?: string) => {
  const el = document.createElement("div");
  el.className =
    "fixed bottom-6 right-6 bg-[#1e1f26dd] text-white px-4 py-2 rounded-lg border border-[#44ff9a55] font-orbitron text-sm backdrop-blur-md shadow-lg";
  el.style.textShadow = "0 0 8px #44ff9a";
  el.innerHTML = `${title}${body ? `<br/><span class='text-xs text-gray-300'>${body}</span>` : ""}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
};
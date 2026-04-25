document.addEventListener("DOMContentLoaded", () => {
  if (typeof loadProducts === "function") {
    loadProducts();
  } else {
    console.error("loadProducts is not defined");
  }
});
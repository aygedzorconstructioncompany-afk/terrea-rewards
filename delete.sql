<!DOCTYPE html>
<html lang="hy">
<head>
<meta charset="UTF-8">
<title>Հաշվետվություններ</title>
</head>

<body>

<div class="wrapper">

  <!-- 🔥 ИКОНКА (КЛИКАБЕЛЬНАЯ) -->
  <div class="header-box year" data-year="2026">
    <div class="icon">📄</div>
    <div>
      <div class="subtitle">Ընթացիկ տարի</div>
      <div class="year-current">2026</div>
    </div>
  </div>

  <!-- ГОДЫ -->
  <div class="years" id="yearsContainer"></div>

</div>

<!-- POPUP -->
<div id="popup" class="popup">
  <div class="popup-content">
    <span class="close">&times;</span>
    <h2 id="popup-title"></h2>
    <div id="popup-list"></div>
  </div>
</div>

<script>
// 🔥 СОЗДАЕМ ГОДЫ 2007–2026
const reports = {};

for (let year = 2007; year <= 2026; year++) {
  reports[year] = {
    title: year + " Հաշվետվություն",
    list: []
  };
}

// 👉 ПРИМЕР С ЗАГОЛОВКАМИ + PDF
reports["2009"].list = [

  { type: "pdf", text: "Հաշվապահական հաշվեկշիռ առ 01.01.2010", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Հաշվապահական-հաշվեկշիռ-առ-01.01.2010.pdf" },

  { type: "title", text: "4-րդ եռամսյակ" },
  { type: "pdf", text: "Փաստաթուղթ 1", pdf: "#" },
  { type: "pdf", text: "Փաստաթուղթ 2", pdf: "#" },
  { type: "pdf", text: "Փաստաթուղթ 3", pdf: "#" },

  { type: "title", text: "3-րդ եռամսյակ" },
  { type: "pdf", text: "Փաստաթուղթ 4", pdf: "#" },
  { type: "pdf", text: "Փաստաթուղթ 5", pdf: "#" },

  { type: "title", text: "2-րդ եռամսյակ" },
  { type: "pdf", text: "Փաստաթուղթ 6", pdf: "#" },

  { type: "title", text: "1-ին եռամսյակ" },
  { type: "pdf", text: "Փաստաթուղթ 7", pdf: "#" }

];

// 🔥 ОСТАЛЬНЫЕ ГОДЫ (обычные PDF)
reports["2008"].list = [
  { type: "pdf", text: "Աուդիտորական եզրակացություն-2017թ.", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Աուդիտորական-եզրակացություն-2008թ.pdf" },
  { type: "pdf", text: "Հաշվապահական հաշվեկսիռ Ձև 1", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Հաշվապահական-հաշվեկշիռ-Ձև-1.pdf" },
  { type: "pdf", text: "Ֆինանսական արդյունքների մասին հաշվետվություն, Ձև 2", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Ֆինանսական-արդյունքների-մասին-հաշվետվություն-Ձև-2-1.pdf" },
  { type: "pdf", text: "Սեփական կապիտալում փոփոխությունների մասին հաշվետվություն, Ձև 3", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Սեփական-կապիտալում-փոփոխությունների-մասին-հաշվետվություն-Ձև-3-1.pdf" },
  { type: "pdf", text: "Դրամական միջոցների հոսքերի մասին հաշվետվություն, Ձև 4", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Դրամական-միջոցների-հոսքերի-մասին-հաշվետվություն-Ձև-4.pdf" },
  { type: "pdf", text: "Ֆինանսական հաշվետվություններին կից ծանոթագրություններ, Ձև 5", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Ֆինանսական-հաշվետվություններին-կից-ծանոթագրություններ-Ձև-5-1.pdf" }
];

reports["2007"].list = [ { text: "Աուդիտորական եզրակացություն-2017թ.", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Աուդիտորական-եզրակացություն-2017թ.pdf" }, { text: "Հաշվապահական հաշվեկսիռ Ձև 1", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Հաշվապահական-հաշվեկսիռ-Ձև-1.pdf" }, { text: "Ֆինանսական արդյունքների մասին հաշվետվություն, Ձև 2", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Ֆինանսական-արդյունքների-մասին-հաշվետվություն-Ձև-2.pdf" }, { text: "Սեփական կապիտալում փոփոխությունների մասին հաշվետվություն, Ձև 3", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Սեփական-կապիտալում-փոփոխությունների-մասին-հաշվետվություն-Ձև-3.pdf" }, { text: "Դրամական միջոցների հոսքերի մասիմ հաշվետվություն, Ձև 4", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Դրամական-միջոցների-հոսքերի-մասիմ-հաշվետվություն-Ձև-4.pdf" }, { text: "Ֆինանսական հաշվետվություններին կից ծանոթագրություններ, Ձև 5", pdf: "https://atms.am/prime/wp-content/uploads/2026/03/Ֆինանսական-հաշվետվություններին-կից-ծանոթագրություններ-Ձև-5.pdf" } ];

// 🔥 ВЫВОД ГОДОВ
const yearsContainer = document.getElementById("yearsContainer");

Object.keys(reports)
  .filter(year => year != "2026")
  .sort((a, b) => b - a)
  .forEach(year => {
    const el = document.createElement("div");
    el.className = "year";
    el.dataset.year = year;
    el.innerText = year;
    yearsContainer.appendChild(el);
  });

const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const popupList = document.getElementById("popup-list");

// 🔥 КЛИК
document.addEventListener("click", function(e) {

  const yearEl = e.target.closest(".year");

  if (yearEl) {
    const year = yearEl.dataset.year;
    const data = reports[year];

    if (!data) return;

    popupTitle.innerText = data.title;

    popupList.innerHTML = data.list.length
      ? data.list.map(item => {

          if (item.type === "title") {
            return `<h3 class="section-title">${item.text}</h3>`;
          }

          if (item.type === "pdf") {
            return `
              <p class="pdf-link" data-pdf="${item.pdf}">
                ${item.text}
              </p>
            `;
          }

          return "";

      }).join("")
      : "<p>Нет документов</p>";

    popup.style.display = "block";
  }

  // 🔥 КЛИК ПО PDF
  if (e.target.classList.contains("pdf-link")) {
    window.open(e.target.dataset.pdf, "_blank");
  }

});

// 🔥 ЗАКРЫТИЕ
document.querySelector(".close").onclick = () => popup.style.display = "none";

window.onclick = (e) => {
  if (e.target === popup) popup.style.display = "none";
};
</script>

</body>
</html>
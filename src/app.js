const countries = document.querySelector("#countries");

const detailPanel = document.querySelector(".country-detail-sidebar");
const detailFlag = document.querySelector("#detail-flag");
const detailName = document.querySelector("#detail-name");
const detailOfficial = document.querySelector("#detail-official");
const detailPopulation = document.querySelector("#detail-population");
const detailRegion = document.querySelector("#detail-region");
const detailCapital = document.querySelector("#detail-capital");
const detailCurrency = document.querySelector("#detail-currency");
const detailLanguages = document.querySelector("#detail-languages");
const detailBorders = document.querySelector("#detail-borders");
const closeDetail = document.querySelector("#close-detail");

const regionSelect = document.querySelector("#region-select");
const btnSearchCountry = document.querySelector("#search-country");

const regions = {
    africa: "África",
    americas: "América",
    asia: "Asia",
    europe: "Europa",
    oceania: "Oceanía",
};

function renderCountries(lista) {
    countries.innerHTML = "";
    closeDetailFunc();

    lista.forEach((pais) => {
        // Tarjeta
        const countryCard = document.createElement("article");
        countryCard.className = "country-card";

        // bandera
        const countryFlag = document.createElement("img");
        countryFlag.src = pais.bandera;
        countryFlag.alt = `Bandera de ${pais.nombre_comun}`;
        countryFlag.className = "card-flag";

        // cuerpo con datos
        const countryBody = document.createElement("div");
        countryBody.className = "card-body";
        countryBody.innerHTML = `
        <h3>${pais.nombre_comun}</h3>
        <p><strong>Población:</strong> ${pais.poblacion.toLocaleString()}</p>
        <p><strong>Región:</strong> ${pais.region}</p>
        <p><strong>Capital:</strong> ${pais.capital}</p>
    `;

        // Armando: bandera y cuerpo DENTRO del article
        countryCard.appendChild(countryFlag);
        countryCard.appendChild(countryBody);

        // Colgar tarjeta
        countries.appendChild(countryCard);

        // Detalles aside
        countryCard.addEventListener("click", function () {
            // solo una seleccionada a la vez
            const anterior = document.querySelector(".country-card.selected");
            if (anterior) anterior.classList.remove("selected");
            countryCard.classList.add("selected");

            // llenar el panel con ESTE pais
            detailFlag.src = pais.bandera;
            detailFlag.alt = `Bandera de ${pais.nombre_comun}`;
            detailName.textContent = pais.nombre_comun;
            detailOfficial.textContent = pais.nombre_oficial;
            detailPopulation.textContent = pais.poblacion.toLocaleString();
            detailRegion.textContent = pais.region;
            detailCapital.textContent = pais.capital;
            detailCurrency.textContent = pais.moneda;
            detailLanguages.textContent = pais.idiomas.join(", ");
            detailBorders.textContent =
                pais.fronteras.join(", ") || "Sin fronteras";

            // mostrar
            detailPanel.classList.remove("hide");
            detailPanel.classList.add("show");
        });
    });
}

regionSelect.addEventListener("change", function () {
    const valor = regionSelect.value;
    if (valor === "") {
        renderCountries(paises);
        return;
    }

    const regionEleg = regions[valor];

    const filtrados = filteredByRegion(regionEleg);
    renderCountries(filtrados);
});

function closeDetailFunc() {
    detailPanel.classList.remove("show");
    detailPanel.classList.add("hide");
    const anterior = document.querySelector(".country-card.selected");
    if (anterior) anterior.classList.remove("selected");
}

function filteredByRegion(region) {
    return paises.filter(function (pais) {
        return pais.region === region;
    });
}

function similarCountry(cadena, pattern) {
    const scapeRegExp = (str) =>
        str.replace(/([.+?^=!:${}()|[\]/\\])/g, "\\$1");
    const patternRegExp =
        "^" + pattern.split("*").map(scapeRegExp).join(".*") + "$";
    return new RegExp(patternRegExp).test(cadena);
}

function searchCountry() {
    var countryInput = document.querySelector("#countries-search");
    var countryValue = countryInput.value.trim();

    if (countryValue !== "") {
        const region = regionSelect.value;
        let filtrados = paises;
        if (region !== "") filtrados = filteredByRegion(regions[region]);

        const result = filtrados.filter(function (pais) {
            countryValue += "*";
            return similarCountry(
                pais.nombre_comun.toLowerCase(),
                countryValue.toLowerCase(),
            );
        });
        renderCountries(result);
    } else {
        alert("Por favor, ingrese nombre de pais...");
    }
}

renderCountries(paises);
closeDetail.addEventListener("click", closeDetailFunc);
btnSearchCountry.addEventListener("click", searchCountry);

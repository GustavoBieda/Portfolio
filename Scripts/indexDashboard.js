// Seção de Tema

let button = document.querySelector('.teme-js')


const themes = {
  't-light': 't-dark',
  't-dark': 't-light',
}

if (button){
  button.addEventListener('click', event =>{
    event.preventDefault()
    const currentTheme = document.body.dataset.theme
    document.body.setAttribute('data-theme', themes[currentTheme] || 't-light')
  })

}

// Seção Menu Mobile

let buttonMobile = document.querySelector('.ButtonMenu');

function toggleMenu(){
  let nav = document.querySelector('.nav');
  nav.classList.toggle('active')
}

buttonMobile.addEventListener('click', toggleMenu);

// Seção Fechar Modal 

let buttonClose = document.querySelector('.buttonClose')

buttonClose.addEventListener('click', function () {
  let modal = document.querySelector('.modal')
  modal.remove();
})


// Gráfico 'Número de Astronautas Que Viajaram ao Espaço ao Longo do Tempo'

let ctxCardGraphic = document.getElementById('cardGraphic');

new Chart(ctxCardGraphic, {
  type: 'line',
  data: {
    labels: ['1961', '1962', '1963', '1964', '1965', '1966', '1967', '1968', '1969', '1970', '1971', '1971', '1972', '1973', '1974', '1975', '1976', '1977', '1978', '1979', '1980', '1981'
    , '1982', '1983', '1984', '1985', '1986', '1987', '1988', '1989', '1990', '1991', '1992', '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004'
    , '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019'],
    datasets: [{
      label: 'Total de Astronautas',
      data: [4, 4, 5, 3, 9, 6, 4, 11, 3, 7, 4, 11, 3, 4, 4, 4, 5, 2, 7, 6, 9, 17, 24, 40, 4, 5, 7, 11, 18, 22, 23, 21, 15, 17, 15, 16, 16, 6, 7, 12, 17, 5,
      5, 5, 12, 13, 21, 23, 10, 5, 5, 6, 5, 5, 6, 4, 4, 5],
      borderWidth: 1,
      borderColor: 'rgba(128, 128, 128)',
      backgroundColor: '#9BD0F5',
    }]
  },
  options: {
    animation: {
      duration: 2000
    },
    plugins: {
      legend: {
        display: false,
        position: 'botton',
      },
      title: {
          display: true,
          text: 'Número de Astronautas Que Viajaram ao Espaço ao Longo do Tempo',
          color: 'rgba(128, 128, 128)',
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

// Gráfico 'Países Que Mais Possuem Foguetes'

let ctxCardInstitution= document.getElementById('cardInstitution');

new Chart(ctxCardInstitution, {
  type: 'bar',
  data: {
    labels: ['Estados Unidos', 'Paises Sucessores URSS', 'Japão', 'China', 'Ucrania'],
    datasets: [{
      label: 'Total de Foguetes',
      data: [115, 45, 29, 29, 13],
      borderWidth: 1,
      borderColor: 'rgba(229, 246, 255)',
      backgroundColor: ['rgba(200, 200, 100)', 'rgba(100, 210, 110)', 'rgba(2, 120, 255)', 'rgba(122, 250, 205)', 'rgba(82, 199, 155)'],
    }]
  },
  options: {
    indexAxis: 'y',
    animation: {
      duration: 2000
    },
    layout: {
      paddingLeft: 50
    },
    plugins: {
      legend: {
        display: false,
        color: 'rgba(229, 246, 255)',
      },
      title: {
          display: true,
          text: 'Países Que Mais Possuem Foguetes',
          color: 'rgba(128, 128, 128)',
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

// Gráfico 'Países Que Mais Enviaram Astronautas Para o Espaço'

let ctxCardCountries= document.getElementById('cardCountries');

new Chart(ctxCardCountries, {
  type: 'doughnut',
  data: {
    labels: ['Estados Unidos', 'União Soviética', 'Rússia', 'Japão', 'Alemanha', 'China', 'França'],
    datasets: [{
      label: 'Total de Astronautas',
      data: [346, 73, 49, 12, 11, 11, 10],
      borderWidth: 1,
      borderColor: 'rgba(229, 246, 255)',
      backgroundColor: ['rgba(200, 200, 100)', 'rgba(100, 210, 110)', 'rgba(100, 220, 255)', 'rgba(2, 120, 255)', 'rgba(50, 150, 55)', 'rgba(122, 250, 205)', 'rgba(122, 122, 122)'],
    }]
  },
  options: {
    animation: {
      duration: 2000
    },
    layout: {
      paddingLeft: 50
    },
    plugins: {
      legend: {
        display: true,
        color: 'rgba(229, 246, 255)',
      },
      title: {
          display: true,
          text: 'Países Que Mais Enviaram Astronautas Para o Espaço',
          color: 'rgba(128, 128, 128)',
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});


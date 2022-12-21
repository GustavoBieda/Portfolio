const button = document.querySelector('#Certificado')
const modal = document.querySelector('#CertificadoModal')
const buttonClose = document.querySelector('#Buttonfechar')

button.onclick = function (){
    modal.showModal()
}

buttonClose.onclick = function () {
    modal.close()
}

const button1 = document.querySelector('#Certificado1')
const modal1 = document.querySelector('#Certificado1Modal')
const buttonClose1 = document.querySelector('#Buttonfechar1')


button1.onclick = function (){
    modal1.showModal()
}

buttonClose1.onclick = function () {
    modal1.close()
}

const button2 = document.querySelector('#Certificado2')
const modal2 = document.querySelector('#Certificado2Modal')
const buttonClose2 = document.querySelector('#Buttonfechar2')


button2.onclick = function (){
    modal2.showModal()
}

buttonClose2.onclick = function () {
    modal2.close()
}


const button3 = document.querySelector('#Certificado3')
const modal3 = document.querySelector('#Certificado3Modal')
const buttonClose3 = document.querySelector('#Buttonfechar3')


button3.onclick = function (){
    modal3.showModal()
}

buttonClose3.onclick = function () {
    modal3.close()
}

const button4 = document.querySelector('#Certificado4')
const modal4 = document.querySelector('#Certificado4Modal')
const buttonClose4 = document.querySelector('#Buttonfechar4')


button4.onclick = function (){
    modal4.showModal()
}

buttonClose4.onclick = function () {
    modal4.close()
}

const button5 = document.querySelector('#Certificado5')
const modal5 = document.querySelector('#Certificado5Modal')
const buttonClose5 = document.querySelector('#Buttonfechar5')


button5.onclick = function (){
    modal5.showModal()
}

buttonClose5.onclick = function () {
    modal5.close()
}


function copiar(){
    var copiado  = document.querySelector('#CopiarEmail').value
    
    if(navigator.clipboard.writeText(copiado)){
        document.querySelector('#ButtonCopiar').textContent = "Texto Copiado"
        document.querySelector('#ButtonCopiar').style.background = "green";
    }

    setInterval(function(){
        document.querySelector('#ButtonCopiar').style.background = "#5356A9";
    },5000);
    setInterval(function(){
        document.querySelector('#ButtonCopiar').textContent = "Copiar Texto"
    },5000);
}

let buttonMobile = document.querySelector('#ButtonMenu');

function toggleMenu(){
  let nav = document.querySelector('#nav');
  nav.classList.toggle('active')
}

buttonMobile.addEventListener('click', toggleMenu)
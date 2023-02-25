const modal = document.querySelectorAll('.modal');
const btn = document.querySelectorAll('.about')
const close = document.querySelectorAll('.close');

for (let i = 0; i < modal.length; i++) {
  // opens modal
  btn[i].onclick = () => modal[i].style.display = "block";
  
  // close the modal by clicking on x
  close[i].onclick = function() {
    modal[i].style.display = "none";
  }
}

// closes modal by clicking outside it
window.onclick = function(e) {
  modal.forEach(m => {
    if (e.target === m) {
      m.style.display = "none";
    }
  });
} 
var bgColors = [
    "linear-gradient(to right, #00b09b, #96c93d)",
    "linear-gradient(to right, #ff5f6d, #ffc371)",
  ],
  i = 0;

new Toastify({
  text: "Hi",
  gravity: "top",
  position: 'left',
}).showToast();

setTimeout(function() {
  new Toastify({
    duration: 3000,
    text: "Simple TypeScript Toasts",
    gravity: "top",
    position: 'center',
    style: {
      background: '#0f3443'
    }
  }).showToast();
}, 1000);

// Options for the toast
var options = {
  text: "Happy toasting!",
  duration: 2500,
  callback: function() {
    console.log("Toast hidden");
  },
  close: true,
  style: {
    background: "linear-gradient(to right, #00b09b, #96c93d)",
  }
};

// Initializing the toast
var myToast =new Toastify(options);

// Toast after delay
setTimeout(function() {
  myToast.showToast();
}, 4500);

setTimeout(function() {
  new Toastify({
    text: "Highly customizable",
    gravity: "bottom",
    position: 'left',
    close: true,
    style: {
      background: "linear-gradient(to right, #ff5f6d, #ffc371)",
    }
  }).showToast();
}, 3000);
let gra = ["top", "bottom"];
let pos = ["left", "center", "right"]
// Displaying toast on manual action `Try`
document.getElementById("new-toast").addEventListener("click", function() {
  let g = gra.at(Math.floor(Math.random() * gra.length));
  let p = pos.at(Math.floor(Math.random() * pos.length))
  new Toastify({
    gravity: g,
    position: p,
    text: `I am a ${g} ${p} toast`,
    duration: 3000,
    close: i % 3 ? true : false,
    style: {
      background: bgColors[i % 2],
    }
  }).showToast();
  i++;
});

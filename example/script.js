var bgColors = [
    "linear-gradient(to right, #00b09b, #96c93d)",
    "linear-gradient(to right, #ff5f6d, #ffc371)",
  ],
  i = 0;

Toast({
  text: "Hi",
  duration: 4500,
  destination: "https://github.com/apvarun/toastify-js",
  newWindow: true,
  gravity: "top",
  position: 'left',
}).show();

setTimeout(function() {
  Toast({
    text: "Simple JavaScript Toasts",
    gravity: "top",
    position: 'center',
    style: {
      background: '#0f3443'
    }
  }).show();
}, 1000);

// Options for the toast
var options = {
  text: "Happy toasting!",
  duration: 2500,
  onClose: function() {
    console.log("Toast hidden");
  },
  close: true,
  style: {
    background: "linear-gradient(to right, #00b09b, #96c93d)",
  }
};

// Initializing the toast
var myToast = Toast(options);

// Toast after delay
setTimeout(function() {
  myToast.show();
}, 4500);

setTimeout(function() {
  Toast({
    text: "Highly customizable",
    gravity: "bottom",
    position: 'left',
    close: true,
    style: {
      background: "linear-gradient(to right, #ff5f6d, #ffc371)",
    }
  }).show();
}, 3000);

// Displaying toast on manual action `Try`
document.getElementById("new-toast").addEventListener("click", function() {
  Toast({
    text: "I am a toast",
    duration: 3000,
    close: i % 3 ? true : false,
    style: {
      background: bgColors[i % 2],
    }
  }).show();
  i++;
});

let dragItem = document.getElementById('ChatBlock');
let active = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;
 
dragItem.addEventListener('mousedown', drag_start, false);
document.addEventListener('mouseup', drag_end, false);
document.addEventListener('mousemove', drag, false);
 
function drag_start(e) {
  initialX = e.clientX - xOffset;
  initialY = e.clientY - yOffset;
 
  if (e.target === dragItem) {
    active = true;
  }
}
 
function drag_end(e) {
  initialX = currentX;
  initialY = currentY;
 
  active = false;
}
 
function drag(e) {
  if (active) {
    e.preventDefault();
    
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
 
    xOffset = currentX;
    yOffset = currentY;
 
    set_translate(currentX, currentY, dragItem);
  }
}
 
function set_translate(xPos, yPos, el) {
  el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
}
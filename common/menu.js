var xhr = new XMLHttpRequest();
xhr.open('GET', '/common/menu.html', true);
xhr.onreadystatechange = function () {
  if (this.readyState !== 4) return;
  if (this.status !== 200) return;
  document.getElementById('menulink').innerHTML = this.responseText;
};
xhr.send();


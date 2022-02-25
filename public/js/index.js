let input = document.getElementById("nama");
document.getElementById("simpan").onclick = () => {
  localStorage.setItem("nama", input.value);
  document.querySelectorAll("#mynama").forEach((item) => {
    item.value = localStorage.getItem("nama");
  });
};

document.body.onload = () => {
  input.value = localStorage.getItem("nama");
  document.querySelectorAll("#mynama").forEach((item) => {
    item.value = localStorage.getItem("nama");
  });
};

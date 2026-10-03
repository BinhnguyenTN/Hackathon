const $ = (s) => document.querySelector(s);

const state = {
  items: JSON.parse(localStorage.getItem("closet-items") || "[]"),
  stream: null,
  pendingImage: null
};

const els = {
  uploadModal: $("#uploadModal"),
  cameraModal: $("#cameraModal"),
  processingModal: $("#processingModal"),
  editModal: $("#editModal"),
  fileInput: $("#fileInput"),
  cameraVideo: $("#cameraVideo"),
  clothesGrid: $("#clothesGrid"),
  emptyState: $("#emptyState"),
  categoryFilter: $("#categoryFilter"),
  itemCount: $("#itemCount"),
  categoryCount: $("#categoryCount"),
  progressBar: $("#progressBar"),
  processingText: $("#processingText")
};

function openModal(el){ el.classList.remove("hidden"); }
function closeModal(el){ el.classList.add("hidden"); }

function persist(){
  localStorage.setItem("closet-items", JSON.stringify(state.items));
}

function render(){
  const filter = els.categoryFilter.value;
  const items = state.items.filter(x => filter === "All" || x.category === filter);
  els.emptyState.style.display = items.length ? "none" : "block";
  els.clothesGrid.innerHTML = "";
  items.forEach(item => {
    const node = document.importNode($("#itemTemplate").content, true);
    node.querySelector("img").src = item.image;
    node.querySelector("img").alt = item.name;
    node.querySelector("h3").textContent = item.name;
    node.querySelector(".tag").textContent = `${item.category} · ${item.color}`;
    node.querySelector(".delete").addEventListener("click", () => {
      state.items = state.items.filter(x => x.id !== item.id);
      persist(); render();
    });
    els.clothesGrid.appendChild(node);
  });
  els.itemCount.textContent = state.items.length;
  els.categoryCount.textContent = new Set(state.items.map(x => x.category)).size;
}

async function startCamera(){
  try{
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    els.cameraVideo.srcObject = state.stream;
    openModal(els.cameraModal);
  }catch(err){
    alert("Camera access was unavailable. You can upload a photo instead.");
    openModal(els.uploadModal);
  }
}

function stopCamera(){
  if(state.stream){
    state.stream.getTracks().forEach(t => t.stop());
    state.stream = null;
  }
  closeModal(els.cameraModal);
}

function capture(){
  const video = els.cameraVideo;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  canvas.getContext("2d").drawImage(video,0,0,canvas.width,canvas.height);
  state.pendingImage = canvas.toDataURL("image/jpeg", .9);
  stopCamera();
  processImage(state.pendingImage);
}

function processImage(dataUrl){
  openModal(els.processingModal);
  els.progressBar.style.width = "10%";
  const messages = [
    ["Detecting garment…", 35],
    ["Isolating clothing from background…", 65],
    ["Identifying category and color…", 88],
    ["Ready to review.", 100]
  ];
  let i = 0;
  const tick = () => {
    if(i >= messages.length){
      closeModal(els.processingModal);
      $("#previewImage").src = dataUrl;
      $("#itemName").value = guessName();
      $("#itemCategory").value = guessCategory();
      $("#itemColor").value = "Neutral";
      openModal(els.editModal);
      return;
    }
    els.processingText.textContent = messages[i][0];
    els.progressBar.style.width = messages[i][1] + "%";
    i++;
    setTimeout(tick, 450);
  };
  setTimeout(tick, 300);
}

function guessCategory(){
  return "Tops";
}

function guessName(){
  return "New garment";
}

function handleFile(file){
  if(!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = e => {
    state.pendingImage = e.target.result;
    closeModal(els.uploadModal);
    processImage(state.pendingImage);
  };
  reader.readAsDataURL(file);
}

$("#openUpload").addEventListener("click", () => openModal(els.uploadModal));
$("#emptyAdd").addEventListener("click", () => openModal(els.uploadModal));
$("#openCamera").addEventListener("click", startCamera);
$("#modalCamera").addEventListener("click", () => { closeModal(els.uploadModal); startCamera(); });
$("#stopCamera").addEventListener("click", stopCamera);
$("#capturePhoto").addEventListener("click", capture);
els.fileInput.addEventListener("change", e => handleFile(e.target.files[0]));
els.categoryFilter.addEventListener("change", render);

document.querySelectorAll("[data-close]").forEach(btn => {
  btn.addEventListener("click", () => {
    const modal = $("#" + btn.dataset.close);
    if(modal === els.cameraModal) stopCamera(); else closeModal(modal);
  });
});

$("#dropzone").addEventListener("dragover", e => { e.preventDefault(); $("#dropzone").classList.add("drag"); });
$("#dropzone").addEventListener("dragleave", () => $("#dropzone").classList.remove("drag"));
$("#dropzone").addEventListener("drop", e => {
  e.preventDefault(); $("#dropzone").classList.remove("drag"); handleFile(e.dataTransfer.files[0]);
});

$("#saveItem").addEventListener("click", () => {
  state.items.unshift({
    id: crypto.randomUUID(),
    image: state.pendingImage,
    name: $("#itemName").value.trim() || "New garment",
    category: $("#itemCategory").value,
    color: $("#itemColor").value.trim() || "Neutral",
    season: $("#itemSeason").value
  });
  persist();
  closeModal(els.editModal);
  render();
  location.hash = "closet";
});

window.addEventListener("keydown", e => {
  if(e.key === "Escape"){
    document.querySelectorAll(".modal").forEach(m => closeModal(m));
    stopCamera();
  }
});

render();

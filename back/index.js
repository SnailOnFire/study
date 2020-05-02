pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.bootcss.com/pdf.js/2.2.228/pdf.worker.min.js';

const preview = document.getElementById('preview');
const page_num = document.getElementById('page_num');
const out_type = document.getElementById('out_type');

let pdfFile, pdf, pageNum, context = preview.getContext('2d');

out_type.querySelectorAll('.button').forEach(function (btn) {
  btn.onclick = function () {
    out_type.querySelector('.primary').classList.remove('primary');
    btn.classList.add('primary');
  }
});

// 加载PDF文件
function loadPDF(file) {
  pdfFile = file;
  file_name.innerHTML = file.name;

  let reader = new FileReader();
  reader.onload = (e) => showPDF(e.target.result);
  reader.readAsDataURL(file);
}

// 预览PDF
function showPDF(url) {
  let loadingTask = pdfjsLib.getDocument(url);
  loadingTask.promise.then(function (doc) {
    pdf = doc;
    pageNum = 1;
    preview.hidden = false;
    readerPage()
  }, function (reason) {
    alert(reason)
  });
}

// 预览上一页
function prevPage() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  readerPage()
}

//预览下一页
function nextPage() {
  if (pageNum >= pdf.numPages) {
    return;
  }
  pageNum++;
  readerPage()
}

//渲染页面
function readerPage(callback) {
  pdf.getPage(pageNum).then(function (page) {
    let scale = 1.5;
    let viewport = page.getViewport({ scale: scale });

    preview.height = viewport.height;
    preview.width = viewport.width;

    let renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    page.render(renderContext).promise.then(callback);
  });
  page_num.innerText = `页码 : ${pageNum} / ${pdf.numPages}`;
}

// 保存当前页
function save() {
  let a = document.createElement('a');
  let event = new MouseEvent('click');
  let type = out_type.querySelector('.primary').innerText.toLowerCase();
  a.download = pdfFile.name + '-' + pageNum + '.' + type;
  a.href = preview.toDataURL(type === 'png' ? 'image/png' : 'image/jpeg');
  a.dispatchEvent(event)
}

//保存全部页面
function saveAll() {
  pageNum = 1;
  savePage()
}

function savePage() {
  if (pageNum > pdf.numPages) {
    alert('全部保存成功');
    return
  }

  readerPage(function () {
    save();
    pageNum++;
    savePage();
  });
}
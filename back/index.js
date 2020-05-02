pdfjsLib.GlobalWorkerOptions.workerSrc = '../source/js/pdf.worker.min.js';

const preview = document.getElementById('preview');
const page_num = document.getElementById('page_num');
const out_type = document.getElementById('out_type');

let pdfFile, pdf, pageNum, context = preview.getContext('2d');

out_type.querySelectorAll('button').forEach(function (btn) {
  btn.onclick = function () {
    out_type.querySelector('.cur').classList.remove('cur');
    btn.classList.add('cur');
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
    preview.style.display='block';

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
  let type = out_type.querySelector('.cur').innerText.toLowerCase();
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

const addButtons = $('#edit_box .group');
const processButton = $('button.process',addButtons);
const noticeButton = $('button.notice',addButtons);
const editMask = $('#edit_box .mask');
const editBoxTop = $('.show').get(0).offsetTop + 30;
var scrollTop;


processButton.click(function(e) {
  e.stopPropagation();
  editMask.css('display','block');
  noticeButton.removeClass('active');
  $(this).addClass('active');
})

noticeButton.click(function(e) {
  e.stopPropagation();
  editMask.css('display','block');
  processButton.removeClass('active');
  $(this).addClass('active');
})

editMask.click(function() {
  $(this).css('display','none');
  processButton.removeClass('active');
  noticeButton.removeClass('active');
})

$(window).scroll(function () {
  window.pageYOffset !== undefined?scrollTop = window.pageYOffset:scrollTop = document.documentElement.scrollTop;
  if(scrollTop > editBoxTop) {
    addButtons.addClass('fixed');
    addButtons.css('right', ($('body').get(0).offsetWidth - parseInt(editMask.css('width'))) / 2 + 'px');
  } else {
    addButtons.removeClass('fixed');
    addButtons.css('right', 'auto');
  }
})
pdfjsLib.GlobalWorkerOptions.workerSrc = '../source/js/pdf.worker.min.js';

const preview = document.getElementById('preview');
const page_num = document.getElementById('page_num');
const out_type = document.getElementById('out_type');

let pdfFile, pdf, pageNum, infoTimer, context = preview.getContext('2d');

const editBox = $('#edit_box');
const addButtons = $('#edit_box .group');
const processButton = $('button.process',addButtons);
const noticeButton = $('button.notice',addButtons);
const editMask = $('#edit_box .mask');
const editBoxTop = $('.show').get(0).offsetTop + 30;
const input_num = $('#input_num');
let scrollTop,
    processPressed = false,
    noticePressed = false,
    processPosition = [[]],
    noticePosition = [[]],
    curEditBox,
    isMouseDown = false,
    editBoxInnerTop,
    editBoxInnerLeft;

out_type.querySelectorAll('button').forEach(function (btn) {
  btn.onclick = function () {
    out_type.querySelector('.cur').classList.remove('cur');
    btn.classList.add('cur');
  }
});

$('#goto_page').click(function() {
  gotoPage(Number(input_num.val()));
})

// 加载PDF文件
function loadPDF(file) {
  if(file) {
    pdfFile = file;
    file_name.innerHTML = file.name;

    let reader = new FileReader();
    reader.onload = (e) => showPDF(e.target.result);
    reader.readAsDataURL(file);
  }
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
    alertInfo(reason,'fail');
  });
}

// 预览上一页
function prevPage() {
  if(pdf) {
    if (pageNum <= 1) {
      alertInfo('前面没有了！','fail');
      return;
    }
    pageNum--;
    processPosition[pageNum-1] instanceof Array ? '' : processPosition[pageNum-1] = [];
    noticePosition[pageNum-1] instanceof Array ? '' : noticePosition[pageNum-1] = [];
    readerPage()
  } else {
    alertInfo('请先选择文件！','fail');
  }
}

// 预览下一页
function nextPage() {
  if(pdf) {
    if (pageNum >= pdf.numPages) {
      alertInfo('后面没有了！','fail');
      return;
    }
    pageNum++;
    processPosition[pageNum-1] instanceof Array ? '' : processPosition[pageNum-1] = [];
    noticePosition[pageNum-1] instanceof Array ? '' : noticePosition[pageNum-1] = [];
    readerPage()
  } else {
    alertInfo('请先选择文件！','fail');
  }
}

// 跳转指定页
function gotoPage(num) {
  if(pdf) {
    if(pageNum !== num) {
      if(num >= 0 && num <= pdf.numPages) {
        num ? pageNum = num : pageNum = pdf.numPages;
        processPosition[pageNum-1] instanceof Array ? '' : processPosition[pageNum-1] = [];
        noticePosition[pageNum-1] instanceof Array ? '' : noticePosition[pageNum-1] = [];
        readerPage();
      } else {
        alertInfo('页码应介于1-'+ pdf.numPages + '之间！','fail');
        input_num.focus();
      }
    }
  } else {
    alertInfo('请先选择文件！','fail');
  }
}

// 渲染页面
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

    $('#edit_box .edit-box').hide();
    if(!$('#edit_box_' + (pageNum-1)).length) {
      $('<div class="edit-box" id="edit_box_' + (pageNum-1) + '"></div>').appendTo(editBox);
    } else {
      $('#edit_box_' + (pageNum-1)).show();
    }
    curEditBox = $('#edit_box_' + (pageNum-1));
    editBoxInnerTop = $('.show .inner').get(0).offsetTop;
    editBoxInnerLeft = $('.show .inner').get(0).offsetLeft;
  });
  page_num.innerText = `页码 : ${pageNum} / ${pdf.numPages}`;
  $('#page_num_fixed').text(`页码 : ${pageNum} / ${pdf.numPages}`);
}

// 保存当前页
function save() {
  let a = document.createElement('a');
  let event = new MouseEvent('click');
  let type = out_type.querySelector('.cur').innerText.toLowerCase();
  a.download = pdfFile.name.split('.')[0] + '-' + pageNum + '.' + type;
  a.href = preview.toDataURL(type === 'png' ? 'image/png' : 'image/jpeg');
  a.dispatchEvent(event)
}

// 保存全部页面
function saveAll() {
  pageNum = 1;
  savePage()
}

function savePage() {
  if(pdf) {
    if (pageNum > pdf.numPages) {
      alertInfo('全部保存成功');
      return
    }
    readerPage(function () {
      save();
      pageNum++;
      savePage();
    });
  } else {
    alertInfo('请先选择文件！','fail');
  }
}

// 信息提示
function alertInfo(info, type, time) {
  var _time = time,
      _type = type;
  _time?'':_time = 3000;
  switch(_type) {
    case 'success':
    case undefined:
      $('#alert_box').removeClass('fail');
      break;
    case 'fail':
      $('#alert_box').addClass('fail');
    default:
      break;
  }
  clearTimeout(infoTimer);
    $('#alert_box').text(info).stop(true).fadeIn();
    infoTimer = setTimeout(function() {
      $('#alert_box').stop(true).fadeOut();
    }, _time);
}

// 取消添加
function cancelAdd() {
  processPressed = false;
  noticePressed = false;
  editMask.css('display','none');
  processButton.removeClass('active');
  noticeButton.removeClass('active');
  $('#edit_box .mark.temp').addClass('hide');
}

// 添加解题过程
function addProcess() {
  noticePressed = false;
  noticeButton.removeClass('active');
  processPressed = !processPressed;
  if(processPressed) {
    editMask.css('display','block');
    processButton.addClass('active');
  } else {
    editMask.css('display','none');
    processButton.removeClass('active');
  }
}
processButton.click(function(e) {
  e.stopPropagation();
  addProcess();
})

// 添加易错点
function addNotice() {
  processPressed = false;
  processButton.removeClass('active');
  noticePressed = !noticePressed;
  if(noticePressed) {
    editMask.css('display','block');
    noticeButton.addClass('active');
  } else {
    editMask.css('display','none');
    noticeButton.removeClass('active');
  }
}

noticeButton.click(function(e) {
  e.stopPropagation();
  addNotice();
})

// p键添加解题过程，n键添加易错点
$(window).keypress(function(e) {
  switch(e.key) {
    case 'p':
      addProcess();
      break;
    case 'n':
      addNotice();
      break;
    default:
      break;
  }
})

// 取消添加
$('body').click(function() {
  cancelAdd();
})

// 添加位置记录
editBox.mousemove(function(e) {
  e.stopPropagation;
  var _left = e.offsetX - 35,
      _top = e.offsetY -13;
  if(processPressed) {
    $('#edit_box .mark.temp').addClass('hide');
    $('#edit_box .mark.process').removeClass('hide').css({'left': _left + 'px', 'top': _top + 'px'});
  }
  if(noticePressed) {
    $('#edit_box .mark.temp').addClass('hide');
    $('#edit_box .mark.notice').removeClass('hide').css({'left': _left + 'px', 'top': _top + 'px'});
  }
})
editBox.click(function(e) {
  e.stopPropagation();
  var _left = e.offsetX - 35,
      _top = e.offsetY -13,
      _node = $('<div class="mark"></div>'),
      _lastIndex;
  if(processPressed) {
    _lastIndex = processPosition[pageNum-1].length ? processPosition[pageNum-1].length : 0;
    processPosition[pageNum-1][_lastIndex] instanceof Array ? '' : processPosition[pageNum-1][_lastIndex] = [];
    processPosition[pageNum-1][_lastIndex][0] = _left;
    processPosition[pageNum-1][_lastIndex][1] = _top;
    _node.text('过程').css({'left': _left + 'px', 'top': _top + 'px'}).appendTo(curEditBox);
    $('<input type="file">').appendTo(_node);
    markDrag(_node, processPosition[pageNum-1][_lastIndex]);
  }
  if(noticePressed) {
    _lastIndex = noticePosition[pageNum-1].length ? noticePosition[pageNum-1].length : 0;
    noticePosition[pageNum-1][_lastIndex] instanceof Array ? '' : noticePosition[pageNum-1][_lastIndex] = [];
    noticePosition[pageNum-1][_lastIndex][0] = _left;
    noticePosition[pageNum-1][_lastIndex][1] = _top;
    _node.text('易错点').css({'left': _left + 'px', 'top': _top + 'px'}).appendTo(curEditBox);
    $('<input type="file">').appendTo(_node);
    markDrag(_node, noticePosition[pageNum-1][_lastIndex]);
  }
  _node = '';
  cancelAdd();
})
addButtons.on('mousemove click',function(e) {
  e.stopPropagation();
})

// 过程、易错点位置拖动，双击“过程”“易错点”添加文件
function markDrag(mark,position) {
  var _startTime,
      _endTime;
  mark.mousedown(function(e) {
    e.stopPropagation();
    isMouseDown = true;
    cancelAdd();
    _startTime = (new Date).getTime();
  })
  mark.mouseup(function(e) {
    e.stopPropagation();
    isMouseDown = false;
    _endTime = (new Date).getTime();
    if(_endTime - _startTime < 200) {
      mark.find('input').click();
    }
  })
  mark.on('mousemove',function(e) {
    e.stopPropagation();
    var _left,
        _top;
    if(isMouseDown) {
      _left = e.pageX - editBoxInnerLeft - 35;
      _top = e.pageY - editBoxInnerTop - 13;
      position[0] = _left;
      position[1] = _top;
      mark.css({'left': _left + 'px', 'top': _top + 'px'});
    }
  })
}

// 窗口滚动
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
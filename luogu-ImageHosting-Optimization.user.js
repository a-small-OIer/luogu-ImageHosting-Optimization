// ==UserScript==
// @name         洛谷图床 · 粘贴上传
// @namespace    https://github.com/a-small-OIer/luogu-ImageHosting-Optimization
// @version      1.0.1
// @description  在洛谷图床 Ctrl+V 粘贴剪贴板里的图片即可上传
// @author       a_small_OIer
// @match        https://www.luogu.com.cn/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

/*
MIT License

Copyright (c) 2026 a-small-OIer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

(function () {
  'use strict';
  var TOAST_ID = 'lgpaste-toast';
  function isImagePage(){
    return /^\/image(\/|$)/.test(location.pathname);
  }
  function findDropZone(){
    return document.querySelector('.upload-layout .drop')
        || document.querySelector('.upload-card .drop')
        || document.querySelector('.drop')
        || document.querySelector('.upload-trigger');
  }
  function findFileInput(){
    var inputs = document.querySelectorAll('input[type="file"]');
    for(var i = 0 ; i < inputs.length ; i++){
      var acc = inputs[i].getAttribute('accept') || '';
      if(!acc || /image/i.test(acc))
        return inputs[i];
    }
    return inputs.length ? inputs[0] : null;
  }
  function sendToDropZone(file, zone){
    if(typeof DataTransfer !== 'function' || typeof DragEvent !== 'function')
        return false;
    try{
      var dt = new DataTransfer();
      dt.items.add(file);
      var ev = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt
      });
      zone.dispatchEvent(ev);
      return true;
    }
    catch(e){
      console.debug('[洛谷图床粘贴] drop 方式失败：', e);
      return false;
    }
  }
  function sendToFileInput(file, input){
    if(typeof DataTransfer !== 'function')
        return false;
    try{
      var dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    catch (e){
      console.debug('[洛谷图床粘贴] file input 方式失败：', e);
      return false;
    }
  }
  function uploadFile(file){
    var zone = findDropZone();
    if(zone && sendToDropZone(file, zone))
        return true;
    var input = findFileInput();
    if(input && sendToFileInput(file, input))
        return true;
    return false;
  }
  function toast(msg, isError){
    var old = document.getElementById(TOAST_ID);
    if(old)
        old.remove();
    var el = document.createElement('div');
    el.id = TOAST_ID;
    el.textContent = msg;
    el.style.cssText = [
      'position:fixed', 'z-index:2147483647', 'left:50%', 'bottom:42px',
      'transform:translateX(-50%)', 'padding:9px 16px', 'border-radius:6px',
      'font-size:14px', 'line-height:1.5', 'color:#fff', 'pointer-events:none',
      'box-shadow:0 3px 12px rgba(0,0,0,.25)', 'transition:opacity .3s',
      'background:' + (isError ? '#c0392b' : '#333'),
      'font-family:inherit'
    ].join(';');
    document.body.appendChild(el);
    setTimeout(function (){
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 350);
    }, isError ? 3600 : 1600);
  }
  function isImageLike(type){
    return !type || type.indexOf('image/') === 0;
  }
  function describeClipboard(dt){
    var out = [];
    try{
      if(dt.items){
        for(var i = 0 ; i < dt.items.length ; i++)
          out.push(dt.items[i].kind + ':' + (dt.items[i].type || '(空类型)'));
      }
    }
    catch(e){ /* 滚木 */ }
    return out.length ? out.join(', ') : '(剪贴板里有个滚木)';
  }
  function pickImageFromClipboard(dt){
    if(!dt)
        return null;
    var items = dt.items;
    if(items && items.length){
      for(var i = 0 ; i < items.length ; i++){
        var it = items[i];
        if(it.kind === 'file' && isImageLike(it.type)){
          var f = it.getAsFile();
          if(f)
            return f;
        }
      }
    }
    var files = dt.files;
    if(files && files.length){
      for(var j = 0; j < files.length; j++){
        if(isImageLike(files[j].type))
            return files[j];
      }
    }
    return null;
  }
  function onPaste(e){
    if(!isImagePage())
        return;
    var dt = e.clipboardData || window.clipboardData;
    if(!dt)
        return;
    var file = pickImageFromClipboard(dt);
    if(!file){
      console.log('[洛谷图床粘贴] 剪贴板里没找到图片，已放行。内容：' + describeClipboard(dt));
      return;
    }
    var t = e.target;
    var inField = t && (
      t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable
    );
    if(inField){
      var hasText = false;
      try{ hasText = !!(dt.getData && dt.getData('text/plain')); }
      catch(err){}
      if(hasText)
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    var name = file.name || ('clipboard-' + Date.now() + '.png');
    var kb = Math.max(1, Math.round(file.size / 1024));
    if(uploadFile(file)){
      console.log('[洛谷图床粘贴] 已把图片移交上传流程：' + name + '（' +
                  kb + ' KB, ' + (file.type || '无类型') + '）');
      toast('已捕获剪贴板图片（' + name + '，' + kb + ' KB），正在上传…');
    }
    else{
      logDiagnose('Error：没找到上传区域');
      toast('没找到图床的上传区域，请确认已登录且停留在图床页面', true);
    }
  }
  function diagnose(){
    var zone = findDropZone();
    var input = findFileInput();
    return {
      url: location.href,
      '在图片页': isImagePage(),
      '上传区域': zone ? (zone.tagName + '.' + (zone.className || '')) : null,
      '文件输入框': input ? (input.tagName + (input.accept ? '[accept=' + input.accept + ']' : '')) : null,
      '有.upload-layout': !!document.querySelector('.upload-layout'),
      '有.upload-card': !!document.querySelector('.upload-card')
    };
  }
  function logDiagnose(tag){
    try{
      var info = diagnose();
      console.log('[洛谷图床粘贴] ' + tag + '：', info);
      return info;
    }
    catch(e){
      console.warn('[洛谷图床粘贴] 自检失败：', e);
      return null;
    }
  }
  document.addEventListener('paste', onPaste, true);
  window.__luoguPasteUpload = {
    uploadFile: uploadFile,
    findDropZone: findDropZone,
    findFileInput: findFileInput,
    pickImageFromClipboard: pickImageFromClipboard,
    check: function () { return logDiagnose('自检'); },
    status: diagnose
  };
  if(isImagePage()){
    var tries = 0;
    (function poll(){
      if(findDropZone()){
        logDiagnose('脚本已就绪，找到上传区域');
        return;
      }
      if(tries++ > 20){
        logDiagnose('脚本已就绪，但没找到上传区域');
        return;
      }
      setTimeout(poll, 300);
    })();
  }
  else{
    console.log('[洛谷图床粘贴] 已挂载（当前路径 ' + location.pathname +
                ' ）');
  }
})();
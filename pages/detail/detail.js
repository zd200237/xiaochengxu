// pages/detail/detail.js
Page({
  data: {
    // ... data内容不变 ...
    groupDetail: null, imageList: []
  },
  onLoad: function (options) {
    console.log("--- Detail Page: onLoad (页面加载) ---", options);
    const groupId = options.group_id;
    if (groupId) {
      this.getGroupDetail(groupId);
    }
  },
  onShow: function() {
    console.log("--- Detail Page: onShow (页面显示) ---");
  },
  onHide: function() {
    console.log("--- Detail Page: onHide (页面隐藏) ---");
  },
  onUnload: function() {
    console.log("--- Detail Page: onUnload (页面卸载) ---");
  },

  // ... getGroupDetail 和 onDownloadAllImages 函数保持不变 ...
  getGroupDetail: function(groupId) { const that = this; const apiUrl = `http://xiaochengxu.uiijii.cn/api.php?action=getGroupDetail&group_id=${groupId}`; wx.request({ url: apiUrl, success: function (res) { if (res.statusCode === 200 && res.data && !res.data.error) { let imageList = []; try { imageList = JSON.parse(res.data.image_list); } catch (e) { console.error("image_list JSON解析失败", e); } that.setData({ groupDetail: res.data, imageList: imageList }); } } }); },
  onDownloadAllImages: function() { const imageList = this.data.imageList; if (!imageList || imageList.length === 0) { wx.showToast({ title: '没有图片可下载', icon: 'none' }); return; } wx.getSetting({ success: (res) => { if (!res.authSetting['scope.writePhotosAlbum']) { wx.authorize({ scope: 'scope.writePhotosAlbum', success: () => { this.startDownload(imageList); }, fail: () => { wx.showToast({ title: '您拒绝了授权', icon: 'none' }); } }) } else { this.startDownload(imageList); } } }); },
  startDownload: function(imageList) { wx.showLoading({ title: '正在保存...', mask: true }); let successCount = 0; let failCount = 0; const total = imageList.length; const checkCompletion = () => { if (successCount + failCount === total) { wx.hideLoading(); let finalTitle = successCount === total ? `全部${successCount}张保存成功` : `成功${successCount}张, 失败${failCount}张`; wx.showToast({ title: finalTitle, icon: 'none', duration: 2000 }); } }; for (let i = 0; i < total; i++) { wx.downloadFile({ url: imageList[i], success: (res) => { if (res.statusCode === 200) { wx.saveImageToPhotosAlbum({ filePath: res.tempFilePath, success: () => { successCount++; checkCompletion(); }, fail: () => { failCount++; checkCompletion(); } }); } else { failCount++; checkCompletion(); } }, fail: () => { failCount++; checkCompletion(); } }); } }
})
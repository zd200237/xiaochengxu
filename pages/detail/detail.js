Page({
  data: {
    groupDetail: null,
    imageList: [],
    productDetail: null
  },
  onLoad: function (options) {
    console.log("--- Detail Page: onLoad (页面加载) ---", options);
    const groupId = options.group_id;
    const productId = options.product_id;
    if (productId) {
      this.getProductDetail(productId);
    } else if (groupId) {
      this.getGroupDetail(groupId);
    }
  },
  getProductDetail: function(productId) {
    const that = this;
    const apiUrl = `https://xiaochengxu.uiijii.cn/api.php?action=getProductDetail&product_id=${productId}`;
    wx.request({
      url: apiUrl,
      success: function (res) {
        if (res.statusCode === 200 && res.data && !res.data.error) {
          let imageList = Array.isArray(res.data.image_list) ? res.data.image_list : [];
          if ((!imageList || imageList.length === 0) && res.data.cover_image) {
            imageList = [res.data.cover_image];
          }
          that.setData({
            productDetail: res.data,
            imageList: imageList
          });
        } else {
          wx.showToast({ title: res.data.error || '未找到商品', icon: 'none' });
        }
      }
    });
  },
  getGroupDetail: function(groupId) {
    const that = this;
    const apiUrl = `https://xiaochengxu.uiijii.cn/api.php?action=getGroupDetail&group_id=${groupId}`;
    wx.request({
      url: apiUrl,
      success: function (res) {
        if (res.statusCode === 200 && res.data && !res.data.error) {
          let imageList = Array.isArray(res.data.image_list) ? res.data.image_list : [];
          that.setData({
            groupDetail: res.data,
            imageList: imageList
          });
        }
      }
    });
  },
  onImageLongPress: function(event) {
    const currentUrl = event.currentTarget.dataset.src;
    if (!currentUrl) {
      return;
    }
    wx.previewImage({
      current: currentUrl,
      urls: this.data.imageList
    });
  },
  onDownloadAllImages: function() {
    const imageList = this.data.imageList;
    if (!imageList || imageList.length === 0) {
      wx.showToast({ title: '没有图片可下载', icon: 'none' });
      return;
    }
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.startDownload(imageList);
            },
            fail: () => {
              wx.showToast({ title: '您拒绝了授权', icon: 'none' });
            }
          });
        } else {
          this.startDownload(imageList);
        }
      }
    });
  },
  startDownload: function(imageList) {
    wx.showLoading({ title: '正在保存...', mask: true });
    let successCount = 0;
    let failCount = 0;
    const total = imageList.length;
    const checkCompletion = () => {
      if (successCount + failCount === total) {
        wx.hideLoading();
        let finalTitle = successCount === total ? `全部${successCount}张保存成功` : `成功${successCount}张, 失败${failCount}张`;
        wx.showToast({ title: finalTitle, icon: 'none', duration: 2000 });
      }
    };
    for (let i = 0; i < total; i++) {
      wx.downloadFile({
        url: imageList[i],
        success: (res) => {
          if (res.statusCode === 200) {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => { successCount++; checkCompletion(); },
              fail: () => { failCount++; checkCompletion(); }
            });
          } else {
            failCount++; checkCompletion();
          }
        },
        fail: () => { failCount++; checkCompletion(); }
      });
    }
  },
  // FAB一键复制
  onCopyFab: function(e) {
    const fab = e.currentTarget.dataset.fab;
    wx.setClipboardData({
      data: fab,
      success: function() {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  }
});

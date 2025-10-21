// pages/show/detail/detail.js (更新后)
Page({
  data: {
    imageList: [],
    loading: true
  },

  onLoad: function (options) {
    const seasonName = options.season;
    const seriesName = options.series;
    if (seasonName && seriesName) {
      this.getImages(seasonName, seriesName);
      wx.setNavigationBarTitle({ title: seriesName });
    }
  },

  getImages: function(seasonName, seriesName) {
    this.setData({ loading: true });
    wx.request({
      url: `https://xiaochengxu.uiijii.cn/get_show_images.php?season=${seasonName}&series=${seriesName}`,
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({ imageList: res.data });
        }
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },

  previewImage: function(event) {
    const currentUrl = event.currentTarget.dataset.url;
    wx.previewImage({
      current: currentUrl,
      urls: this.data.imageList
    });
  },

  // --- === 新增：批量保存图片相关函数 === ---

  /**
   * 点击下载按钮时触发
   */
  onDownloadAllImages: function() {
    const imageList = this.data.imageList;
    if (!imageList || imageList.length === 0) {
      wx.showToast({ title: '没有图片可下载', icon: 'none' });
      return;
    }

    // 1. 检查授权状态
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          // 2. 如果未授权，发起授权请求
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              // 3. 用户同意授权后，开始下载
              this.startDownload(imageList);
            },
            fail: () => {
              // 4. 用户拒绝授权，给出提示
              wx.showToast({ title: '您拒绝了授权', icon: 'none' });
            }
          });
        } else {
          // 5. 如果已授权，直接开始下载
          this.startDownload(imageList);
        }
      }
    });
  },

  /**
   * 开始执行下载流程
   * @param {Array} imageList 要下载的图片URL数组
   */
  startDownload: function(imageList) {
    wx.showLoading({ title: '正在保存...', mask: true });
    
    let successCount = 0;
    let failCount = 0;
    const total = imageList.length;

    // 完成一个下载任务后的检查函数
    const checkCompletion = () => {
      if (successCount + failCount === total) {
        wx.hideLoading();
        let finalTitle = `成功${successCount}张, 失败${failCount}张`;
        if (failCount === 0) {
            finalTitle = `全部${successCount}张保存成功`;
        }
        wx.showToast({ title: finalTitle, icon: 'none', duration: 2000 });
      }
    };

    // 循环下载列表
    for (let i = 0; i < total; i++) {
      wx.downloadFile({
        url: imageList[i],
        success: (res) => {
          if (res.statusCode === 200) {
            // 下载成功，保存到相册
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
  }
});
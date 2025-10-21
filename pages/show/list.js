// pages/show/list.js (最终调试版)
Page({
  data: {
    showList: [],
    loading: true
  },
  onLoad: function (options) {
    this.getShowList();
  },
  getShowList: function() {
    this.setData({ loading: true });
    wx.request({
      url: 'https://xiaochengxu.uiijii.cn/get_shows.php',
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          this.setData({ showList: res.data });
        } else {
          wx.showToast({ title: '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'error' });
      },
      complete: () => {
        this.setData({ loading: false });
      }
    });
  },
  
  // --- 这是本次修改的核心 ---
  goToSubList: function(event) {
    // 1. 打印日志，确认函数被触发
    console.log('--- 卡片被点击了 ---');

    // 2. 打印从WXML传过来的完整数据
    const item = event.currentTarget.dataset.item;
    console.log('--- 获取到的 item 数据: ---', item);

    // 3. 检查item是否存在，以及关键的 hasContent 属性
    if (!item) {
      console.error('--- 错误：未能从 event 中获取到 item 数据！---');
      return;
    }
    console.log('--- 条件判断: item.hasContent 的值为', item.hasContent, '---');

    // 4. 执行判断逻辑
    if (!item.hasContent) {
      console.log('--- 判断结果：hasContent 为 false 或 undefined，显示提示框，不跳转。---');
      wx.showToast({
        title: '暂无内容',
        icon: 'none'
      });
      return; // 提前结束函数
    }
    
    // 5. 准备跳转
    const url = `/pages/show/sublist/sublist?season=${item.path}`;
    console.log('--- 判断通过，准备跳转到 URL:', url, '---');
    
    wx.navigateTo({
      url: url,
      fail: (err) => {
        // 6. 如果跳转失败，打印错误信息
        console.error('--- wx.navigateTo 跳转失败: ---', err);
      }
    });
  }
});
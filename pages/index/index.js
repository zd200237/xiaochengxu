// pages/index/index.js

Page({
  /**
   * 页面的初始数据
   * 用于存放所有需要被WXML页面使用的数据
   */
  data: {
    brandList: [] // 用于存放从API获取的品牌列表，初始为空数组
  },

  /**
   * 生命周期函数--监听页面加载
   * 这个函数会在页面第一次打开时自动执行
   */
  onLoad: function (options) {
    // 调用我们自己写的函数，去服务器获取品牌数据
    this.getBrands();
  },

  /**
   * 自定义函数：获取品牌列表
   * 负责与我们的后端API通信
   */
  getBrands: function () {
    const that = this; // 保存this上下文，在回调函数中使用，这是小程序开发的一个常用技巧

    // 调用微信的网络请求API
    wx.request({
      // 填写我们之前开发好的API地址
      url: 'http://xiaochengxu.uiijii.cn/api.php?action=getBrands',
      
      // 请求成功时的回调函数
      success: function (res) {
        console.log('成功从API获取到品牌数据:', res.data);

        // 检查服务器返回的状态码和数据格式是否正确
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          // 使用 setData 方法将获取到的数据更新到页面的 data 中
          // 这样WXML页面就会自动刷新，显示出列表
          that.setData({
            brandList: res.data
          });
        }
      },
      
      // 请求失败时的回调函数
      fail: function (err) {
        console.error('API请求失败:', err);
        // 给用户一个友好的错误提示
        wx.showToast({
          title: '加载失败',
          icon: 'error'
        });
      }
    });
  },

  /**
   * 自定义函数：处理品牌卡片的点击事件
   * WXML里的 bindtap="goToGroupList" 会调用这个函数
   * @param {Object} event 事件对象，包含了点击事件的所有信息
   */
  goToGroupList: function (event) {
    // 从被点击的元素上，获取我们通过 data-brandid 附带的品牌ID
    const brandId = event.currentTarget.dataset.brandid;
    
    console.log('用户点击了品牌，ID为: ' + brandId);

    // 调用微信的页面跳转API
    wx.navigateTo({
      // 定义要跳转到的页面路径，并通过URL参数把品牌ID传过去
      // 这就像在浏览器里访问 a.html?id=1 一样
      url: '/pages/list/list?brand_id=' + brandId
    });
  }
})
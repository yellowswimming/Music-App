<template>

	<view class="detail">
		<view class="fixbg" :style="{'background-image':'url('+songDetail.al.picUrl+')'}"></view>
		<musicHead icon="true" :title="songDetail.name" color="white"></musicHead>
		<view class="container" v-show="!isLoading">
			<scroll-view :scroll-y="true">
				<view v-if="isLoading">
					<m-for-skeleton :avatarSize="200" :row="10" :loading="isLoading" :isarc="'square'"
						v-for="(item,key) in 10" :key="key" :titleStyle="{}" :title="false">

					</m-for-skeleton>
				</view>

				<view v-else>
					<view class="detail-play" @tap="handleToPlay()">
						<image :src="songDetail.al.picUrl" :class="{'detail-play-run':isPlayRotate}" mode="aspectFill">
						</image>
						<text class="iconfont" :class="iconPlay"></text>
					</view>
					<view class="detail-lyric">
						<view class="detail-lyric-wrap" :style="{transform:'translateY('+ -(lyricIndex-1)*82 +'rpx)'}">
							<view class="detail-lyric-item" :class="{active: lyricIndex==index}"
								v-for="(item,index) in songLyric" :key="index">{{item.lyric}}</view>
						</view>

					</view>
					<view class="detail-like">
						<view class="detail-like-head">喜欢这首歌的人也听</view>
						<view class="detail-like-item" v-for="(item,index) in songSimi" :key="index"
							@tap="handleToSimi(item.id)">
							<view class="detail-like-img">
								<image :src="item.album.picUrl"></image>
							</view>
							<view class="detail-like-song">
								<view>{{item.name}}</view>
								<view>{{item.album.artists[0].name}} - {{item.name}}</view>
							</view>
							<text class="iconfont icon-bofang"></text>
						</view>
					</view>
					<view class="detail-comment">
						<view class="detail-comment-head">精彩评论</view>
						<view class="detail-comment-item" v-for="(item,index) in songComment" :key="index">
							<view class="detail-comment-img">
								<image :src="item.user.avatarUrl"></image>
							</view>
							<view class="detail-comment-content">
								<view class="detail-comment-title">
									<view class="detail-comment-name">
										<view>{{item.user.nickname}}</view>
										<view>{{item.time | formatTime}}</view>
									</view>
									<view class="detail-comment-like">{{item.likedCount | formatCount}} <text
											class="iconfont icon-good"></text></view>
								</view>
								<view class="detail-comment-text">{{item.content}}</view>
							</view>
						</view>
					</view>
				</view>


			</scroll-view>
		</view>
	</view>
</template>

<script>
	import {
		songDetail,
		songSimi,
		songComment,
		songLyric,
		songUrl
	} from '../../common/api.js'
	import mForSkeleton from "@/components/m-for-skeleton/m-for-skeleton";
	export default {
		data() {
			return {
				songDetail: {
					al: {
						picUrl: ''
					}
				},
				songSimi: [],
				songComment: [],
				songLyric: [],
				lyricIndex: 0,
				// bgAudioManager: {
				// 	title: "",
				// 	url: ""
				// },
				iconPlay: 'icon-24gl-pauseCircle',
				isPlayRotate: true,
				isLoading: true,
				imgUrl: ""
			};
		},
		onLoad(e) {

			// uni.showLoading({
			// 	mask: true
			// });
			this.getMusic(e.id);
			this.imgUrl = e.url;


		},
		onShow() {
			this.$forceUpdate()
		},

		onUnload() {
			this.cancelLyricIndex()
			// #ifdef H5
			this.bgAudioManager.destroy()
			// #endif
		},
		onHide() {
			this.cancelLyricIndex();
			// #ifdef H5
			this.bgAudioManager.destroy()
			// #endif
		},
		methods: {
			handleToSimi(id) {
				this.getMusic(id);
			},

			handleToPlay() {
				if (this.bgAudioManager.paused) {
					this.bgAudioManager.play();
				} else {
					this.bgAudioManager.pause();
				}
			},
			getMusic(songId) {
				Promise.all([songDetail(songId), songSimi(songId), songComment(songId), songLyric(songId), songUrl(
					songId)]).then((res) => {
					if (res[0][1].data.code == '200') {
						this.songDetail = res[0][1].data.songs[0];
					}
					if (res[1][1].data.code == '200') {
						this.songSimi = res[1][1].data.songs;
					}
					if (res[2][1].data.code == '200') {

						this.songComment = res[2][1].data.hotComments;
					}
					if (res[3][1].data.code == '200') {
						let lyric = res[3][1].data.lrc.lyric;
						let re = /\[([^\]]+)\]([^\[]+)/g;
						let result = [];
						lyric.replace(re, ($0, $1, $2) => {
							result.push({
								"time": this.formatTimeToSec($1),
								"lyric": $2
							});
						});
						this.songLyric = result;

					}
					if (res[4][1].data.code == '200') {
						// #ifdef MP-WEIXIN
						this.bgAudioManager = uni.getBackgroundAudioManager();
						this.bgAudioManager.title = this.songDetail.name;
						// #endif
						// #ifdef H5
						if (!this.bgAudioManager) {
							this.bgAudioManager = uni.createInnerAudioContext();
						}

						this.iconPlay = 'icon-bofang';
						this.isPlayRotate = false;
						// #endif

						// #ifdef APP
						this.bgAudioManager = uni.getBackgroundAudioManager();
						this.bgAudioManager.title = this.songDetail.name;
						// #endif


						this.bgAudioManager.src = res[4][1].data.data[0].url || '';
						this.listenLyricIndex();
						this.bgAudioManager.onPlay(() => {
							this.iconPlay = 'icon-24gl-pauseCircle';
							this.isPlayRotate = true;
							this.listenLyricIndex();
						});
						this.bgAudioManager.onPause(() => {
							this.iconPlay = 'icon-bofang';
							this.isPlayRotate = false;
							this.cancelLyricIndex();
						})
						this.isLoading = false;
						// uni.hideLoading()
					}

				})


			},
			formatTimeToSec(value) {
				let arr = value.split(':');
				return (Number(arr[0] * 60) + Number(arr[1])).toFixed(1);
			},
			listenLyricIndex() {
				clearInterval(this.timer);
				this.timer = setInterval(() => {
					for (let i = 0; i < this.songLyric.length; i++) {
						if (this.bgAudioManager.currentTime > this.songLyric[this.songLyric.length - 1].time) {
							this.lyricIndex = this.songLyric.length - 1;
							break;
						}
						if (this.bgAudioManager.currentTime > this.songLyric[i].time && this.bgAudioManager
							.currentTime < this.songLyric[i + 1].time) {
							this.lyricIndex = i;
						}
					}
				}, 500)
			},
			cancelLyricIndex() {
				clearInterval(this.timer);
			}
		}
	}
</script>

<style lang="scss" scoped>
	.detail-play {
		width: 580rpx;
		height: 580rpx;
		margin: 214rpx auto 0 auto;
		position: relative;

		image {
			width: 100%;
			height: 100%;
			position: absolute;
			left: 0;
			right: 0;
			top: 0;
			bottom: 0;
			margin: auto;
			border-radius: 50%;
			animation: 10s linear move infinite;
			animation-play-state: paused;
		}



		text {
			width: 120rpx;
			height: 120rpx;
			font-size: 100rpx;
			color: white;
			position: absolute;
			left: 0;
			right: 0;
			top: 0;
			bottom: 0;
			margin: auto;
		}
	}

	.detail-play .detail-play-run {
		animation-play-state: running;
	}

	@keyframes move {
		from {
			transform: rotate(0deg);
		}

		to {
			transform: rotate(360deg);
		}
	}

	.detail-lyric {
		font-size: 32rpx;
		line-height: 82rpx;
		height: 246rpx;
		text-align: center;
		overflow: hidden;
		color: #919193;
	}

	.detail-lyric-wrap {
		transition: .5s;
	}

	.detail-lyric-item {
		height: 82rpx;
	}

	.active {
		color: white;
	}

	.detail-like {
		margin: 0 30rpx;
	}

	.detail-like-head {
		font-size: 36rpx;
		color: white;
		margin: 50rpx 0;
	}

	.detail-like-item {
		display: flex;
		align-items: center;
		margin-bottom: 28rpx;
	}

	.detail-like-img {
		width: 82rpx;
		height: 82rpx;
		border-radius: 20rpx;
		overflow: hidden;
		margin-right: 20rpx;
	}

	.detail-like-img image {
		width: 100%;
		height: 100%;
	}

	.detail-like-song {
		color: #c6c2bf;
		flex: 1;
	}

	.detail-like-song view:nth-child(1) {
		font-size: 28rpx;
		color: white;
		margin-bottom: 12rpx;
	}

	.detail-like-song text {
		font-size: 50rpx;
		color: #c6c2bf;
	}

	.detail-comment {
		margin: 0 30rpx;
	}

	.detail-comment-head {
		font-size: 36rpx;
		color: white;
		margin: 50rpx 0;
	}

	.detail-comment-item {
		margin-bottom: 28rpx;
		display: flex;
	}

	.detail-comment-img {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		overflow: hidden;
		margin-right: 18rpx;
	}

	.detail-comment-img image {
		width: 100%;
		height: 100%;
	}

	.detail-comment-content {
		flex: 1;
		color: #cbcacf;
	}

	.detail-comment-title {
		display: flex;
		justify-content: space-between;
	}

	.detail-comment-name view:nth-child(1) {
		font-size: 26rpx;
	}

	.detail-comment-name view:nth-child(2) {
		font-size: 20rpx;
	}

	.detail-comment-like {
		font-size: 28rpx;
	}

	.detail-comment-text {
		font-size: 28rpx;
		line-height: 40rpx;
		color: white;
		margin-top: 20rpx;
		border-bottom: 1px #e0e0e0 solid;
		padding-bottom: 40rpx;

	}
</style>

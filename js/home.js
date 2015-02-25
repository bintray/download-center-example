(function($) {

	function unlockPad() {

	}

	function flipElements() {
		$(".login-button").addClass('disabled').html("Please wait...")
		$('#login-view')
			.delay(1000)
			.animate({"background-size": 90}, {
			step: function(now,fx) {
				$(this).css('-webkit-transform','rotateX('+now+'deg)');
			},
			complete : function() {
				$(this).hide()
				$("#downloads-view").css({
					display : 'block',
					transform : 'rotateX(-90deg)'
				}).animate({"background-size": 90}, {
					step: function(now,fx) {
						$(this).css('-webkit-transform','rotateX('+(-90+now)+'deg)');
				},
				complete : function() {
					$(".boxxu").fadeIn(300)
				}})
				console.log("HA@")
			},
			easing : 'linear',
			duration: 500
		})
	}

	function loginKeyDn(e) {
		if (e.keyCode == 13) {
			flipElements()
		}
	}

	$(document).ready(function() {
		$(".login-button").click(flipElements)
		$("#login-form").on('keydown',loginKeyDn)
	})

}(jQuery))
var house_edge = 1; // House edge in %

var betbase = new BetBaseAPI({ casino_id: 'PvYxr3J2bO' }); // Your casino identifier


Big.RM = 0;

$(function() {
	
	$('.input-chance').keyup(function(e){
		updateByChance(false);
	});
	$('.input-chance').change(function(e){
		updateByChance(true);
	});
	$('.input-payout').keyup(function(e){
		updateByPayout(false);
	});
	$('.input-payout').change(function(e){
		updateByPayout(true);
	});

	$('.input-wager').keyup(function(e){
		updateProfit();
	});	
	$('.input-wager').change(function(e){
		var wager = new Big(parseFloat($('.input-wager').val()) || 0).round(8);
		$('.input-wager').val(wager.toFixed(8));
		updateProfit();
	});	

	$('.wager-2x').click(function(e){
		e.preventDefault();
		var wager = new Big(parseFloat($('.input-wager').val()) || 0).round(8);
		$('.input-wager').val(wager.times(2).toFixed(8));
		updateProfit();
	});
	$('.wager-max').click(function(e){
		e.preventDefault();
		var wager = new Big(parseFloat(balance) || 0).round(8);
		$('.input-wager').val(wager.toFixed(8));
		updateProfit();
	});

	$('.betHighOrLow').each(function(){
		var $selected = $(this);
		
		$selected.click(function(e){
			e.preventDefault();
			$('.betHighOrLow').removeClass('selected');
			$selected.addClass('selected');
		});
	});


	$('.bets-switch').each(function(){
		var $selected = $(this);
		
    var bets = $selected.attr('data-bets');
    
		$selected.click(function(e){
			e.preventDefault();
			
      if (bets == 'my' && !user) return betbase.login();
      
      $('.bets-switch').removeClass('selected');
			$selected.addClass('selected');
		  switchBets(bets);
    });
	});

	$('.bets-switch.initial').click();
	


  fillSpace();
  
  $(window).resize(function(){
    fillSpace();
  });


  $('.bet').click(function(e) {
    e.preventDefault();
		bet();
  });
  
  $('.deposit').click(function(e){
		e.preventDefault();
		betbase.deposit();
	});
  $('.withdraw').click(function(e){
		e.preventDefault();
		betbase.withdraw();
	});
	
	$('.menu').click(function(e){
		e.preventDefault();
		
		$('.leftpanel').toggle();
		$('.rightpanel').children(':not(:first-child)').toggle();
		$('.menu-open').toggle();
		$('.menu-close').toggle();
	});

});


var user = false;

betbase.listen('login', (data) => {
	
	updateBalance(data.user.balance);
  user = data.user;
  $('.username').text(data.user.username);
	
	$('.hideUnlogged').css('display','block');	
	
});
betbase.listen('balance', (data) => {
	
	updateBalance(data.new_balance);
	
});


function updateByChance(correct) {
	
	var chance = new Big(parseFloat($('.input-chance').val()) || 0).round(2);
	
	if (chance.lt(0.01)) chance = new Big(0.01);
	if (chance.gt(100-house_edge)) chance = new Big(0.01);
	
	if (correct)
		$('.input-chance').val(chance.toFixed(2));
	
	var multip = new Big(100 - house_edge).div(chance);


	$('.input-payout').val(multip.toFixed(2));
	
	updateProfit();
	
}
function updateByPayout(correct) {
	
	var payout = new Big(parseFloat($('.input-payout').val()) || 0).round(2);
	
	if (payout.lt(0.01)) payout = new Big(0.01);
	
	if (correct)
		$('.input-payout').val(payout.toFixed(2));
	
	var chance = new Big(100 - house_edge).div(payout);
	
	if (chance > (100 - house_edge)) {
		$('.input-chance').val(Big(100-house_edge).toFixed(2));
		return (correct) ? updateByChance() : false;
	}
	if (chance < 0.01) {
		$('.input-chance').val(0.01);
		return (correct) ? updateByChance() : false;
	}
	
	$('.input-chance').val(chance.toFixed(2));
	
	updateProfit();
	
}


function updateProfit() {
	var wager = new Big(parseFloat($('.input-wager').val()) || 0).round(8);
	var payout = new Big(parseFloat($('.input-payout').val()) || 0).round(2);
	
	var chance = new Big(100 - house_edge).div(payout);

	$('.input-profit').val(wager.times(payout).toFixed(8));
  
  $('.betHigh').text(Big(100).minus(chance).toFixed(2));
  $('.betLow').text(chance.plus('0.01').toFixed(2));
}



var balance = 0;

function updateBalance(newBal) {
	
	balance = newBal;
	$('.balances').each(function(){
		$(this).text(Big(newBal).toFixed(8));
	});
	
}


function switchBets(bets) {
  
  var $bets = $('table.betTable[data-bets="'+bets+'"]');
  
  if (!$bets.find('td').length) {  // if bets history haven't been loaded yet
  
    var options = {
      user: user.user_id,
      count: 30
    };
  
    betbase.ready(() => {
      betbase.api('bets', options, (r) => {
      
        if (r.error)
          return $bets.append('<tr><td colspan="7" class="no-bets">No bets yet</td></tr>');
        
        
        $bets.find('td.no-bets').remove();
        
        for (var i = 0; i < r.bets.length; i++) {
          appendBet($bets, r.bets[i]);
        }
      
      });
    });
  
    betbase.listen('new_bet', (data) => {
      if (bets == 'my' && data.bet.user.id != user.user_id) return;
      appendBet($bets, data.bet, true);
		});
  
  }
  
  $('.betsFader').fadeOut(80, function(){
  
    $('table.betTable').hide();
    $bets.show();
    
    $('.betsFader').fadeIn(80);
    
  });
  
  
}


function appendBet($bets, bet, prepend) {
  
  var $tr = $('<tr></tr>');
  
  var date = convertUTCDateToLocalDate(new Date(bet.time));
  
  $tr.append('<td><a href="https://betbase.io/bet/'+bet.betId+'" target="_blank">' + bet.betId + '</td>');
  $tr.append('<td>' + bet.user.username + '</td>');
  $tr.append('<td>' + date.toLocaleString() + '</td>');
  $tr.append('<td>' + Big(bet.wager).toFixed(8) + '</td>');
  $tr.append('<td>x' + Big(bet.multiplier).toFixed(2) + '</td>');
  $tr.append('<td>' + Big(bet.outcome).div(100).toFixed(2) + '</td>');
  $tr.append('<td>' + Big(bet.profit).toFixed(8) + '</td>');
  
  if (!prepend)
		$bets.append($tr);
	else
		$tr.insertAfter($bets.find('tr').first());
	
}

function convertUTCDateToLocalDate(date) {
  var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);

  var offset = date.getTimezoneOffset() / 60;
  var hours = date.getHours();

  newDate.setHours(hours - offset);

  return newDate;   
}

function fillSpace() {
  var fromTop = $('.bets').offset().top;
  
  var windowHeight = $(window).height();
  
  $('.bets').css('min-height', windowHeight - fromTop);
}


function bet() {

	$('.input-wager').css('pointer-events', 'none');
  
	var wager = new Big(parseFloat($('.input-wager').val()) || 0).round(8);

  var high_low = $('.betHighOrLow.selected').attr('data-highlow');
  
  var payouts = [];

	var payout = new Big(parseFloat($('.input-payout').val()) || 0).round(2);
	var chance = new Big(100 - house_edge).div(payout);

	var chanceToLose = Big(100).minus(chance).times(100).round();
		
	payouts.push({
		chance: chanceToLose.toString(),
		return: 0
	});
  payouts.push({
		chance: Big(10000).minus(chanceToLose).toString(),
		return: wager.times(payout).toFixed(8)
	});
  
	if (high_low == 'low')
		payouts.reverse();	
		  
  
  var options = {
    wager: wager.toFixed(8),
    range: 10000,
    margin: 1,
    payouts: payouts,
    game: 'dice'
  };
  
  betbase.api('bet', options, (r) => {
		
		$('.input-wager').css('pointer-events', 'all');
		
		if (r.error) {
			
			if (!r.error.code) return Error('Not authorized. Please log in.');
			if (r.error.code == 14) return Error('The win would not be divisible.');
			
			return Error(r.error.message); 
		}
		
		var color = (r.bet.payout != 0) ? '#54bc75' : '#c14848';
		var initial = $('.betbox-top').css('background-color');
		$('.betbox-top').css('background-color', color);
		setTimeout(() => {
			$('.betbox-top').css('background-color', initial);
		}, 100);
	});
  
}

function Error(err) {

	var $errmess = $('<div><b>Error!</b> ' + err + '</div>')
	
	var $error = $('<a href="#" onclick="$(this).remove();return false;" class="error"></a>').append($errmess);
	
	$('.rightpanel').prepend($error);
	
	$error.slideDown(100);
	
}


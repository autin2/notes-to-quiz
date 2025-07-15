<body>
<div id="blur-overlay">
  <div class="pyramid-loader">
    <div class="wrapper">
      <div class="side side1"></div>
      <div class="side side2"></div>
      <div class="side side3"></div>
      <div class="side side4"></div>
      <div class="shadow"></div>
    </div>
  </div>
</div>


 <h1>Notes To Quiz AI</h1>

  <textarea id="notes" placeholder="Paste your notes here..."></textarea>
  <button class="outer-cont" onclick="generateQuiz()">Generate Quiz</button>

  <div id="quiz-container"></div>

  <script>
    let currentQuestionIndex = 0;
    let quizData = [];
    let feedbackTimeout;
    let score = 0;
    let correctCount = 0;
    let totalCount = 0;
	
	function showLoading() {
		document.getElementById('blur-overlay').classList.add('active');
	}

	function hideLoading() {
	  document.getElementById('blur-overlay').classList.remove('active');
	}

	
    async function generateQuiz() {
	  const notes = document.getElementById('notes').value.trim();
	  if (!notes) {
		alert('Please paste some notes first.');
		return;
	  }
	  
	  showLoading();

	  const res = await fetch('/api/quiz', {
		  method: 'POST',
		  headers: { 'Content-Type': 'application/json' },
		  body: JSON.stringify({ notes }),
	});


	  hideLoading();

	  const data = await res.json();
	  if (data.error) {
		alert('Error: ' + data.error);
		return;
	  }

	  quizData = data.quiz;
	  currentQuestionIndex = 0;
	  score = 0;
	  correctCount = 0;
	  totalCount = quizData.length;
	  showQuestion();
	}


	
    function showQuestion() {
      if (currentQuestionIndex >= quizData.length) {
		const percent = Math.round((score / (totalCount * 20)) * 100);
		document.getElementById('quiz-container').innerHTML = `
		<h2>🎉 Quiz Complete!</h2>
		<p>✅ Correct: ${correctCount}</p>
		<p>❌ Incorrect: ${totalCount - correctCount}</p>
		<p>🏆 Score: ${percent} / 100</p>
		<button id="retry-btn" onclick="retryQuiz()">Retry</button>
		`;
		return;
	}


      const q = quizData[currentQuestionIndex];
      const container = document.getElementById('quiz-container');
      container.innerHTML = `
        <div class="flashcard">
          <h3>Question ${currentQuestionIndex + 1} of ${totalCount}</h3>
          <p>${q.question}</p>
          <div id="choices">
            ${q.choices.map(choice =>
              `<button onclick="checkAnswer('${choice}', this)">${choice}</button>`
            ).join('')}
          </div>
          <p id="feedback" style="font-weight:bold; margin-top:10px;"></p>
        </div>
      `;
    }

    function checkAnswer(selected, button) {
      clearTimeout(feedbackTimeout);
      const q = quizData[currentQuestionIndex];
      const feedbackEl = document.getElementById('feedback');

      if (selected === q.answer) {
        feedbackEl.textContent = '✅ Correct!';
        feedbackEl.style.color = 'green';
        score += 20; // 5 questions × 20 = 100
        correctCount++;
      } else {
        feedbackEl.textContent = `❌ Wrong! Correct answer: ${q.answer}`;
        feedbackEl.style.color = 'red';
      }

      // Disable all buttons after answering
      const buttons = document.querySelectorAll('#choices button');
      buttons.forEach(btn => btn.disabled = true);

      // Move to next question automatically after 2 seconds
      feedbackTimeout = setTimeout(() => {
        currentQuestionIndex++;
        showQuestion();
      }, 2000);
    }
  </script>

</body>
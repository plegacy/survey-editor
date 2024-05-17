document.addEventListener('DOMContentLoaded', async () => {
    const questionTitle = document.getElementById('questionTitle');
    const questionImage = document.getElementById('questionImage');
    const answersContainer = document.getElementById('answersContainer');
    const answerTemplate = document.getElementById('answerTemplate').firstElementChild;
    const addAnswerTemplate = document.getElementById('addAnswerTemplate').firstElementChild;
    const localStorageKey = 'surveyEditorData';

    // Load state from local storage or fetch initial data from S3
    const savedData = localStorage.getItem(localStorageKey);
    if (savedData) {
        const data = JSON.parse(savedData);
        initializeData(data);
    } else {
        const dataUrl = 'https://digital-commons.tolunastart.com/fe/data.json';
        try {
            const response = await fetch(dataUrl);
            const data = await response.json();
            initializeData(data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // Save question to local storage
    questionTitle.addEventListener('blur', saveData);

    function initializeData(data) {
        // question
        questionTitle.innerText = data.question.text;
        if (data.question.imageURL) {
            questionImage.src = data.question.imageURL;
            questionImage.classList.remove('hidden');
        }
        // answers
        answersContainer.innerHTML = '';
        data.answers.forEach(answer => {
            addAnswer(answer.text, answer.imageURL, true);
        });
        if (data.selectedAnswer) {
            highlightSelectedAnswer(data.selectedAnswer);
        }

        // add answer
        addAddAnswerThumbnail();
    }

    function addAnswer(text = '', imageURL = '', isExisting = false) {
        const newAnswer = answerTemplate.cloneNode(true);
        const deleteBtn = newAnswer.querySelector('.delete-btn');
        const answerTitle = newAnswer.querySelector('.answer-title');
        const answerImage = newAnswer.querySelector('.answer-image');
        const answerCheckbox = newAnswer.querySelector('.answer-checkbox');

        answerTitle.value = text;
        if (imageURL) {
            answerImage.src = imageURL;
            answerImage.classList.remove('hidden');
        }

        //save answer text
        answerTitle.addEventListener('input', saveData);

        //delete answer
        deleteBtn.addEventListener('click', () => {
            newAnswer.remove();
            addAddAnswerThumbnail();
            saveData();
        });

        //select answer
        answerCheckbox.addEventListener('change', () => {
            if (answerCheckbox.checked) {
                highlightSelectedAnswer(answerTitle.value);
            }
            saveData();
        });

        newAnswer.addEventListener('click', () => {
            answerCheckbox.checked = true;
            highlightSelectedAnswer(answerTitle.value);
            saveData();
        });

        answersContainer.appendChild(newAnswer);
        removeAddAnswerThumbnail();
    }

    function highlightSelectedAnswer(selectedTitle) {
        document.querySelectorAll('.answer-item').forEach(answerItem => {
            const answerTitle = answerItem.querySelector('.answer-title').value;
            if (answerTitle === selectedTitle) {
                answerItem.classList.add('selected');
                answerItem.querySelector('.answer-checkbox').checked = true;
            } else {
                answerItem.classList.remove('selected');
                answerItem.querySelector('.answer-checkbox').checked = false;
            }
        });
    }

    function addAddAnswerThumbnail() {
        const addAnswerItem = addAnswerTemplate.cloneNode(true);
        addAnswerItem.addEventListener('click', () => {
            addAnswer();
            saveData();
        });
        answersContainer.appendChild(addAnswerItem);
    }

    function removeAddAnswerThumbnail() {
        const addAnswerItem = answersContainer.querySelector('.add-answer-item');
        if (addAnswerItem) {
            addAnswerItem.remove();
        }
    }

    function saveData() {
        const data = {
            question: {
                text: questionTitle.innerText,
                imageURL: questionImage.src
            },
            answers: []
        };

        let selectedAnswer = null;

        answersContainer.querySelectorAll('.answer-item').forEach(answerItem => {
            const answerTitle = answerItem.querySelector('.answer-title').value;
            const answerImage = answerItem.querySelector('.answer-image').src;
            if (answerItem.querySelector('.answer-checkbox').checked) {
                selectedAnswer = answerTitle;
            }
            if (answerTitle && answerImage) {
                data.answers.push({
                    text: answerTitle,
                    imageURL: answerImage
                });
            }
        });

        if (selectedAnswer) {
            data.selectedAnswer = selectedAnswer;
        }

        localStorage.setItem(localStorageKey, JSON.stringify(data));
    }

    window.makeEditable = function(element) {
        element.contentEditable = true;
        element.classList.add('editable');
        element.focus();
        element.addEventListener('blur', () => {
            element.contentEditable = false;
            element.classList.remove('editable');
            saveData();
        }, { once: true });
    }
});
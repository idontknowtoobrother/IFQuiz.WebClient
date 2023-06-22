// Resources
import "./style.css";
import { onErrorProfileImageUrl, svgMap } from "../../../config/constraints";

// React Router | Components | Redux
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// Reducers
import { setUserImageUrl } from "../../../reducers/user";
import { setSelectedQuestionId, setTakingQuiz, setSelectedChoiceId, setSelectedMultipleChoice, setFillChoice } from "../../../reducers/take";

// Services
import { getUserProfileImage } from "../../../services/user";

// Utils
import { getTimerLabel } from "../../../utils/functions/timer";

// Ours Components
import NavbarTakeQuiz from "../../../components/take-quiz-navbar";
import QuestionSelector from "../../../components/question.selector";
import SingleChoice from "../../../components/choice/single";
import MultipleChoice from "../../../components/choice/multiple";
import Notify from "../../../components/notify";
import { getQuestionImage, submitQuiz, updateTakeQuizAnswers } from "../../../services/quiz";
import { useRef } from "react";
import { getImageFromResponse } from "../../../utils/functions/image.blob";
import InputTextAreaChoice from "../../../components/input/text-area-choice";
import FillChoice from "../../../components/choice/fill";


export default function TakeQuiz() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const quiz = useSelector((state) => state.take.quiz);
	const user = useSelector((state) => state.user.authUser);
	const updatingAnswersRef = useRef(false)

	const [selectedQuestionImages, setSelectedQuestionImages] = useState([]);
	const [timerLabel, setTimerLabel] = useState(getTimerLabel(quiz?.copyof?.expiredAt) || null); // [label, setLabel
	const [notify, setNotify] = useState({
		show: false,
		title: "",
		message: "",
	});

	function showNotify(svg, title, message, cb) {
		setNotify({
			svg: svg,
			title: title,
			show: true,
			message: message,
			cb: cb
		});
	}
	function closeNotify() {
		setNotify({
			svg: null,
			title: "",
			show: false,
			message: "",
			cb: null
		})
	}



	useEffect(() => {

		if (!quiz) {
			showNotify('error', 'You have to take quiz first.', 'We will redirect you to home page.', () => navigate('/home'))
			return
		}

		async function fetchProfileImage() {
			await getUserProfileImage(user.token, (url) => {
				dispatch(setUserImageUrl(url));
			});
		}

		return () => fetchProfileImage(); // call once

	}, [])

	useEffect(() => {
		let intervalId = null;

		const handleTimerComplete = () => {
			showNotify('success', 'Time is up!', 'We will redirect you to the result page.', async () => {
				try {
					const completedQuiz = await submitQuiz(user.token, quiz?.copyof?._id)
					dispatch(setTakingQuiz(null));
					navigate(`/score/${completedQuiz._id}`);
				} catch (e) {
					dispatch(setTakingQuiz(null));
					navigate('/activity/completed');
				}

			});
			clearInterval(intervalId);
		};

		intervalId = setInterval(() => {
			setTimerLabel(getTimerLabel(quiz?.copyof?.expiredAt, handleTimerComplete));
		}, 1000);

		return () => {
			clearInterval(intervalId);
		};
	}, []);


	const isNowStateIsFillUpdate = useRef(false)
	const isUpdating = useRef(false)
	async function updateAnswersAndSelctedQuestionId() {
		if (quiz?.copyof?._id && quiz?.answers) {
			console.log('updateting...', quiz?.answers)
			const res = await updateTakeQuizAnswers(user.token, {
				selectedQuestionId: quiz.selectedQuestionId,
				quizId: quiz.copyof._id,
				answers: quiz.answers
			})
			if (res?.quiz) {
				console.log('updated')
				isUpdating.current = false
			}
		}
	}

	function handlerSelectQuestion(index) {
		dispatch(setSelectedQuestionId(index))
	}

	function handlerSelectSingleChoice(answerId) {
		isUpdating.current = true
		dispatch(setSelectedChoiceId(answerId))
	}

	function handlerFillChoice(fillString) {
		isUpdating.current = true
		isNowStateIsFillUpdate.current = true
		dispatch(setFillChoice(fillString))
	}

	function handlerMultipleChoice(handler, selectId) {
		isUpdating.current = true
		const payload = {
			handler: handler,
			selectId: selectId
		}
		dispatch(setSelectedMultipleChoice(payload))
	}


	useEffect(() => {
		if (isNowStateIsFillUpdate.current) {
			isUpdating.current = false
			isNowStateIsFillUpdate.current = false
			return
		}
		updateAnswersAndSelctedQuestionId()
	}, [quiz])


	async function refreshQuestionImage(listImageUrl) {
		if (!listImageUrl) {
			setSelectedQuestionImages([])
			return
		}
		const newSelectedQuestionImages = []
		for (const imageUrl of listImageUrl) {
			const resImage = await getQuestionImage(imageUrl);
			const renderImage = getImageFromResponse(resImage)
			newSelectedQuestionImages.push(renderImage)
		}
		setSelectedQuestionImages(newSelectedQuestionImages)
	}

	function adjustTextareaHeight() {
		var textarea = document.getElementById(`answer-text-area-${quiz?.selectedQuestionId}`);
		if (!textarea) return
		textarea.style.height = "auto"; // Reset height to allow scrollHeight calculation
		textarea.style.height = textarea.scrollHeight + "px"; // Set the height to the scroll height
	}



	const firstTimeRefreshImage = useRef(false)
	useEffect(() => {
		if (firstTimeRefreshImage.current) return
		firstTimeRefreshImage.current = true
		refreshQuestionImage(quiz?.questions[quiz.selectedQuestionId]?.explanation?.imageUrl)
	}, [])

	useEffect(() => {
		refreshQuestionImage(quiz?.questions[quiz.selectedQuestionId]?.explanation?.imageUrl)
		adjustTextareaHeight()
	}, [quiz?.selectedQuestionId])

	return (
		<>
			<Notify
				svg={notify.svg}
				title={notify.title}
				show={notify.show}
				message={notify.message}
				handleClose={closeNotify}
				cb={notify.cb}
			/>
			{quiz ? (

				<div className="take__quiz__main__container">
					<NavbarTakeQuiz
						imageUrl={user?.imageUrl || onErrorProfileImageUrl}
						fullname={user.fullname}
						quizName={quiz.copyof.name}
					/>
					<div className="take__quiz__container">
						<div className="question__selection">
							<div className="header">
								<div className="icon">
									{svgMap.question}
								</div>
								Question
							</div>
							<QuestionSelector
								answers={quiz.answers}
								selectedQuestionId={quiz.selectedQuestionId}
								handlerSelectQuestion={handlerSelectQuestion}
							/>
						</div>
						<div className="question__timer">
							<div className="icon">
								{svgMap.timer_blue}
							</div>
							{timerLabel}
						</div>
					</div>
					{isUpdating.current === true ? (
						<div className="save-answer-info-container">
							<div className="loader"></div>
							<div className="save-label-info">
								Saving your answer...
							</div>
						</div>

					) : (
						<div className="save-answer-info-container">
							<div class="loader-eye">
								<span></span>
							</div>
							<div className="save-label-info">
								Watching
							</div>
						</div>
					)}

					<div className="block-space-center">
						<div className="task__take__container">
							{selectedQuestionImages?.length > 0 ? (
								<div className='take-explanation-image'>
									{selectedQuestionImages.map((imageStream, i) => {
										return <div
											key={`question-image-${i}`}
											className="image-item"
										>
											<img src={imageStream} alt='question-image'></img>
										</div>
									})}
								</div>
							) : null}
							<div className="question">
								{quiz?.questions[quiz.selectedQuestionId]?.explanation?.explain}
							</div>

							{
								quiz?.questions[quiz.selectedQuestionId]?.type === 'single-choice' ? (
									<SingleChoice
										choices={quiz.questions[quiz.selectedQuestionId].answer}
										selectedId={quiz.answers[quiz.selectedQuestionId].selectedId}
										handlerSelectSingleChoice={handlerSelectSingleChoice}
									/>
								) : quiz?.questions[quiz.selectedQuestionId]?.type === 'multiple-choice' ? (
									<MultipleChoice
										choices={quiz.questions[quiz.selectedQuestionId].answer}
										selectedIds={quiz.answers[quiz.selectedQuestionId].selectedIds}
										handlerMultipleChoice={handlerMultipleChoice}
									/>
								) : quiz?.questions[quiz.selectedQuestionId]?.type === 'fill-choice' ? (
									// Fill Choice
									<FillChoice
										index={quiz.selectedQuestionId}
										handlerFillChoice={handlerFillChoice}
										handlerUpdate={updateAnswersAndSelctedQuestionId}
										value={quiz.answers[quiz.selectedQuestionId].matchString}
									/>
								) : null
							}

						</div>
					</div>

				</div>
			) : null}

		</>
	);
}

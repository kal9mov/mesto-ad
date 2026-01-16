/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { createCardElement, likeCard } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { getUserInfo, getCardList, setUserInfo, setUserAvatar, addNewCard, deleteCard, likeCardApi } from "./components/api.js";

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const siteLogo = document.querySelector(".header__logo");
const infoModalWindow = document.querySelector(".popup_type_info");
const infoTitle = infoModalWindow.querySelector(".popup__title");
const infoContent = infoModalWindow.querySelector(".popup__info");
const infoText = infoModalWindow.querySelector(".popup__text");
const infoList = infoModalWindow.querySelector(".popup__list");

const statItemTemplate = document.querySelector("#popup-info-definition-template").content;
const popularCardTemplate = document.querySelector("#popup-info-user-preview-template").content;

let userId;

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const confirmModalWindow = document.querySelector(".popup_type_remove-card");
const confirmForm = confirmModalWindow.querySelector(".popup__form");

const renderLoading = (isLoading, button) => {
  button.textContent = isLoading ? "Сохранение..." : "Сохранить";
};

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(true, submitButton);

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, submitButton);
    });
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  renderLoading(true, submitButton);

  setUserAvatar(avatarInput.value)
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(false, submitButton);
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  submitButton.textContent = "Создание...";

  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(
          cardData,
          {
            onPreviewPicture: handlePreviewPicture,
            onLikeIcon: handleLikeCard,
            onDeleteCard: handleCardDeleteRequest,
          },
          userId
        )
      );
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

const handleCardDeleteRequest = (cardElement, cardId) => {
  cardToDelete = { element: cardElement, id: cardId };
  openModalWindow(confirmModalWindow);
};

const handleLikeCard = (likeButton, likeCount, cardId) => {
  likeCard(likeButton, likeCount, cardId, likeCardApi);
};

const createStatItem = (term, description) => {
  const item = statItemTemplate.querySelector(".popup__info-item").cloneNode(true);
  item.querySelector(".popup__info-term").textContent = term;
  item.querySelector(".popup__info-description").textContent = description;
  return item;
};

const createBadgeItem = (text) => {
  const item = popularCardTemplate.querySelector(".popup__list-item").cloneNode(true);
  item.textContent = text;
  return item;
};

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      infoContent.innerHTML = "";
      infoList.innerHTML = "";
      infoTitle.textContent = "Статистика карточек";
      infoText.textContent = "Популярные карточки:";

      const seenAuthors = [];
      cards.forEach((card) => {
        let isSeen = false;
        seenAuthors.forEach((id) => {
          if (id === card.owner._id) {
            isSeen = true;
          }
        });
        if (!isSeen) {
          seenAuthors.push(card.owner._id);
        }
      });
      infoContent.append(createStatItem("Всего пользователей:", seenAuthors.length));

      let totalLikes = 0;
      cards.forEach((card) => {
        totalLikes += card.likes.length;
      });
      infoContent.append(createStatItem("Всего лайков:", totalLikes));

      const likers = [];

      cards.forEach((card) => {
        card.likes.forEach((user) => {
          let existingLiker = null;
          likers.forEach((candidate) => {
            if (candidate.name === user.name) {
              existingLiker = candidate;
            }
          });

          if (existingLiker) {
            existingLiker.count += 1;
          } else {
            likers.push({
              name: user.name,
              count: 1,
            });
          }
        });
      });

      let maxLikesFromOne = 0;
      let championName = "-";

      likers.forEach((liker) => {
        if (liker.count > maxLikesFromOne) {
          maxLikesFromOne = liker.count;
          championName = liker.name;
        }
      });

      infoContent.append(createStatItem("Максимально лайков от одного:", maxLikesFromOne));
      infoContent.append(createStatItem("Чемпион лайков:", championName));

      const sortedCards = cards.slice().sort((a, b) => b.likes.length - a.likes.length);
      const top3 = sortedCards.slice(0, 3);

      top3.forEach((card) => {
        infoList.append(createBadgeItem(card.name));
      });

      openModalWindow(infoModalWindow);
    })
    .catch((err) => {
      console.log(err);
    });
};

// EventListeners/.
siteLogo.addEventListener("click", handleLogoClick);
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

//настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

let cardToDelete;

const handleDeleteCardSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  submitButton.textContent = "Удаление...";
  
  deleteCard(cardToDelete.id)
    .then(() => {
      cardToDelete.element.remove();
      closeModalWindow(confirmModalWindow);
      cardToDelete = null;
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
    });
};

confirmForm.addEventListener("submit", handleDeleteCardSubmit);

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => { // Код отвечающий за отрисовку полученных данных
    userId = userData._id;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(
          cardData,
          {
            onPreviewPicture: handlePreviewPicture,
            onLikeIcon: handleLikeCard,
            onDeleteCard: handleCardDeleteRequest,
          },
          userId
        )
      );
    });
  })
  .catch((err) => {
    console.log(err); // В случае возникновения ошибки выводим её в консоль
  });
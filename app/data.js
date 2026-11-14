// 파티에서 쓰는 데이터 모음
export const partyData = {
      hostNickname: "주인장",
    // 파티 BGM (내 음악 파일) — public 폴더에 넣고 "/파일이름.mp3" 로 적어요
  bgmFile: "/bgm.mp3",
  // (선택) 트리 그림 — 배경에 트리가 없으면 "/tree.png" 처럼 넣어 주세요. 비워 두면 배경의 트리를 그대로 써요
  treeImage: '',
  // 식탁 위 음식 (왼쪽부터 시계 방향) — id는 mapConfig.js의 FOOD_SPOTS와 같아야 해요
  foods: [
    {
      id: 'food1',
      emoji: '🍝',
      image: '/foods/lasagna.png', // public/foods 폴더의 그림
      name: '라자냐',
      description: '겨무밤의 시그니처. 다섯 번의 겨무밤을 함께 했어요.',
    },
    {
      id: 'food2',
      emoji: '🍎',
      image: '/foods/apple.png', // public/foods 폴더의 그림
      name: '사과와 아몬드스프레드',
      description: '호주에서 매일 먹었던 조합.',
    },
    {
      id: 'food3',
      image: '/foods/boni.png', // public/foods 폴더의 그림
      emoji: '🌰',
      name: '보늬밤',
      description:
        '군산에서의 첫 가을, 햇밤으로 만들었어요. 엄청난 노동의 산물!',
    },
    {
      id: 'food4',
      image: '/foods/mgpizza.png', // public/foods 폴더의 그림
      emoji: '🍕',
      name: '마르게리따 피자',
      description:
        '애인에게 피자를 만드는 취미가 생기면, 최고의 마르게리따 피자를 먹을 수 있죠. \n 단, 거대한 오븐 필요!',
    },
    {
      id: 'food5',
      image: '/foods/baechu.png', // public/foods 폴더의 그림
      emoji: '🥬',
      name: '부추 양배추 돼지고기 볶음',
      description:
        '도시락 단골 메뉴. \n저렴한 재료지만 언제 먹어도 맛있는 반찬.',
    },
  ],

  // 올해의 책 (color = 책등과 표지 색)
  books: [
    {
      id: 'book1',
      title: '면도날',
      author: 'W.서머싯 몸',
      color: '#203f90',
      comment:
        '어떤 땐 이런 생각이 들어. 이런 것 저런 것 고민하는 나라는 사람은 도대체 어떤 존재일까? 내가 거만하고 몹쓸 인간이라서 그런걸지도 몰라. 나도 남들 가는 길을 가면서, 그럭저럭 세상사에 순응하면서 사는 게 현명하지 않을까? 그런 생각 말이야.',
    },
    {
      id: 'book2',
      title: '빈 배처럼 텅 비어',
      author: '최승자',
      color: '#020650',
      comment: '나는 항상 나를 탈출한다. 그러나 결코 벗어나지 못한다.',
    },
    {
      id: 'book3',
      title: '삶의 한가운데',
      author: '루이제 린저',
      color: '#ea5503',
      comment: '나는 가끔 니나였고, 동시에 대체로 슈타인이었다..',
    },
    {
      id: 'book4',
      title: '변신',
      author: '프란츠 카프카',
      color: '#ce9a3a',
      comment: '그 누가 그레고리에게 뭐라 할 수 있나!',
    },
    {
      id: 'book5',
      title: '시대예보 - 수고인류의 시간',
      author: '송길영',
      color: '#5a524d',
      comment:
        '밖에서 보면 지나치게 사소한 차이에 집착하는 것처럼 보여도, 당사자에게는 그 차이를 알아주는 사람이 있다는 사실 자체가 즐거움입니다. 수고를 알아보는 눈과 그것을 알아봐 주는 사람이 만날 때, 수고의 가치는 비로소 선명해집니다.',
    },
    {
      id: 'book6',
      title: '안녕이라 그랬어',
      author: '김애란',
      color: '#115b36',
      comment:
        '고마움이란 건 왜 꼭 받아 마땅한 사람에게 전하는 게 이토록 힘든걸까.',
    },
    {
      id: 'book7',
      title: '달과 6펜스',
      author: 'W.서머싯 몸',
      color: '#3d7038',
      comment: '추는 항상 좌우로 흔들리고, 사람들은 같은 원을 늘 새롭게 돈다.',
    },
    {
      id: 'book8',
      title: '크눌프',
      author: '헤르만 헤세',
      color: '#063031',
      comment: '헤세, 편안함에 이르렀나?',
    },
  ],

  // 그룹 통화 초대장 (식탁 위 봉투)
  //  - links: 통화 주소 (Google Meet, Zoom 등 여러 개 가능 / https:// 로 시작해야 해요)
  //  - note: 비밀번호 같은 안내 (없으면 지워도 돼요)
  call: {
    title: '🎄 겨울이 무르익는 밤 라이브 초대장', // 창 맨 위 제목
    time: '12월 15일 (일) 저녁 7시', // 빨간 날짜 띠
    message:
      '우리 구글 MEET에서 만나요.\n편한 옷, 따뜻한 음료와 간식 챙겨 오세요 ☕', // 편지 내용 (\n = 줄바꿈)
    host: '주인장', // "— 파티 주인 드림"
    links: [
      { label: 'Google Meet로 참여하기', url: 'https://meet.google.com/...' }, // 버튼 글자, 통화 주소
    ],
    image: '', // (선택) 봉투 그림 — 비워 두면 코드로 그린 도트 봉투가 보여요
  },
  // 올해의 문장 (올해 읽은 책에서 좋았던 문구)
  //  - text: 문장 / book: 책 제목 / author: 지은이 (book, author는 비워도 돼요)
  //  - 줄을 복사해서 문장을 더 추가할 수 있어요
  quotes: [
    {
      text: '여기에 마음에 남은 문장을 적어 주세요.',
      book: '책 제목',
      author: '지은이',
    },
    {
      text: '두 번째 문장도 이렇게 추가할 수 있어요.',
      book: '책 제목',
      author: '지은이',
    },
  ],
  // (선택) 올해의 문장 액자 그림 — 비워 두면 코드로 그린 도트 액자가 보여요
  quoteFrameImage: '',

  // 올해의 영화 (poster = 포스터 이미지 경로, 없으면 color + emoji로 표시)
  movies: [
    {
      id: 'movie1',
      title: '가능한 사랑',
      director: '이창동',
      year: 2026,
      emoji: '🚉',
      color: '#1e3a8a',
      poster: '/posters/movie1.png',
      comment:
        '사랑을 가능하게 하는 것과 불가능하게 하는 것, \n 그 차이를 만드는 건 불가능하다고 생각하는 나의 마음 때문일까 아니면 그것이 결코 가능하지 않기 때문일까? \n미옥 화이팅',
    },
    {
      id: 'movie2',
      title: '거북이는 의외로 빨리 헤엄친다',
      director: '미키 사토시',
      year: 2005,
      emoji: '🎻',
      color: '#9a3412',
      poster: '/posters/movie2.png',
      comment:
        '슈팅스타 같았던 코미디. 26년 상반기 본 최고의 코미디 영화.    \n아즈키 판다짱~ \n토모도 돈토통~',
    },
    {
      id: 'movie3',
      title: '아니마',
      director: '폴 토마스 앤더슨',
      year: 2019,
      emoji: '🪐',
      color: '#4c1d95',
      poster: '/posters/movie3.png',
      comment: '15분에 담긴 인생. \n나는 무엇에 그토록 매료되었는가',
    },
  ],
};

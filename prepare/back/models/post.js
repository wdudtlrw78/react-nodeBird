// 게시글 정보

const DataTypes = require('sequelize');
const { Model } = DataTypes;

module.exports = class Post extends Model {
  static init(sequelize) {
    return super.init(
      {
        // id가 기본적으로 들어있다.
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        modelName: 'Post',
        tableName: 'posts',
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci', // + mb4 = 이모티콘 저장
        sequelize, // index.js / sequlize을 연결객체를 넣어준다.
      }
    );
  }

  static associate(db) {
    // 관계형 Method 제공 (공통) post.addUser , post.getUser, post.setUser, post.removeUser 유저 생성, 유저 가져오기, 유저 수정, 유저 제거

    db.Post.belongsTo(db.User); // 작성자한테 속해있다.
    db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' }); // 다 대 다 관계 왜냐하면 게시글 안에 해시태그가 들어있다
    // 그럼 1 대 다 관계일까?? 항상 반대도 생각해봐야한다. 해시태그 안에 게시글 여러개 들어갈 수 있을까?? 해시태그는 들어있다.

    db.Post.hasMany(db.Comment); // 게시글이 댓글을 여러개 기질 수 있다.
    db.Post.hasMany(db.Image); // 게시글이 이미지 여러개 기질 수 있다.

    db.Post.belongsTo(db.Post, { as: 'Retweet' }); // 어떤 게시글이 어떤 게시글의 리트윗 게시글일 수 도 있다. PostId -> RetweetId 변경
    // 한 개의 게시글이 여러개의 게시글을 리트윗할 수 있는데 어떤 게시글을 리트윗하면 그 주인이되는 리트윗은 하나이다 그래서 일 대 다 관계이다.
    // ex) 원본 게시글이 있다고 가정 원본 게시글이 마음에들어서 리트윗을 한다. 그러면 리트윗한 게시글들이 여러 사람들이 했을테니까 생길 것이다.
    // 그럼 1(원본) 대 다 관계 한 게시글을 여러 개의 리트윗을 갖고 그 각각의 리트윗한 게시글들은 원본 하나를 가리킨다.
    // 그럼 원본포함 아이디들이 1, 2, 3, 4 가정하고 엑셀 db테이블 관점으로 보면 한 테이블 안에 id , content, RetweetId 엑셀처럼
    // 1번(원본)은 리트윗 안했으니까 RetweetId = null이 처음부터 들어가있을 것이고, 2번 3번 4번은 1번 리트윗했으니까 RetweeId는 1번을 가리킨다.

    // 중간 테이블 이름 // 유저와 좋아요 버튼 관계 다 대 다 관계 ( 중간 테이블 생성 )
    // belongsTo User와 belongsToMany User 가 같아서 헷갈려서 as 를 붙여준다. 나중에 as에 따라서 post.getLikers처럼 게시글 좋아요 누른 사람을 가져오게 된다.
    db.Post.belongsToMany(db.User, { through: 'Like', as: 'Likers' });

    // belongsToMany
    // Hashtag  Post가 있다고 가정하면
    // Post = 게시글안에 안녕 #노드 #리액트 작성 그러면 Hashtag에는
    // Hashtag = 1. 노드  / 2. 리액트 해시태그 생성
    // 이어서 다른사람이 Post = #노드 # 익스프레스 작성 그러면 노드는 원래 있었으니까 상관없고 익스프레스는
    // Hashtag = 3. 익스프레스
    // Post = #뷰 #노드 #리액트
    // Hashtag = 뷰
    // 이런식으로 게시글에 작성함에 따라 해시태그들이 생긴다.
    // 이처럼 다 대 다 관계는 Post 와 Hashtag 중간에 테이블이 생겨서 (이름은 PostHashtag 중간에 테이블 임의로 생긴다)
    // HashtagId  / PostId 짝지어 준다.
    // ex) 1 / 1   2 / 1   1 / 2  3 / 2
    // 왜냐하면 테이블이 있어야지 검색이 가능하기 때문에
  }

  // 질문
  // 초반에 시퀄라이즈로 post modeling 할 때
  // 리트윗을
  // db.Post.belongsTo(db.Post, { as: "Retweet" });
  // 이렇게 작성 했었습니다.
  // 그런데 리트윗의 경우 post와 post가 1:N 관계인데
  // post.hasMany(db.Post)도 같이 추가해 줘야 하는거 아닌가요? 아니면 같은 모델끼리 1:N관계일 때는 belongsTo만 해줘도 괜찮은건가요?

  // 답변
  // 같은 모델끼리는 belongsTo만 해주시면 됩니다. 어떻게서든 모델들 간의 관계를 시퀄라이즈가 파악할수 있으면 됩니다. belongsTo는 필수이지만 hasMany나 hasOne은 필수가 아니라고 보시면 됩니다.
};

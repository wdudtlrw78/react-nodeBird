const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // 파일 시스템 조작

// 게시글 작성, 댓글 작성하는 것도 로그인 여부 파악해야한다.
const { isLoggedIn } = require('./middlewares');
const { Post, User, Image, Comment } = require('../models');

const router = express.Router();

// uploads 폴더 있는지 검사 없으면 에러 발생해서 업로드 폴더 생성한다.
try {
  fs.accessSync('uploads');
} catch (error) {
  console.log('uploads 폴더가 없으므로 생성합니다');
  fs.mkdirSync('uploads');
}

const upload = multer({
  storage: multer.diskStorage({
    // storage : 저장할 장소 diskStorage 하드디스크 (실습) -> 나중에는 배포하면서 아마존 웹 서비스 S3 클라우드에 저장 왜나하면 컴퓨터 하드디스크에 저장하면
    // 나중에 백엔드 서버가 요청 많이 받으면 서버 스케일링 해줘야하는데(같은 서버를 여러 대 복사) 컴퓨터 uploads 폴더에 넣어두면 복사를 할 때마다 이미지가 같이 복사되서 넘어가기 때문에 (용량이 크고 복사하면 쓸 때없는 공간 차지)
    destination(req, file, done) {
      done(null, 'uploads');
    },
    filename(req, file, done) {
      // 모모.png
      const ext = path.extname(file.originalname); // 확장자 추출(.png)
      const basename = path.basename(file.originalname, ext); // 모모
      done(null, basename + '_' + new Date().getTime() + ext); // 모모151841236.png
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
  // POST /post
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
    });

    if (req.body.image) {
      if (Array.isArray(req.body.image)) {
        // 이미지를 여러 개 올리면 image: [모모.png, 무무.png]

        // 배열들을 맵으로 해서 시퀄라이즈 create한다 그럼 프로미스의 배열이 된다.
        // Promise.all 넘겨주면 한 방에 db에 저장된다 db에 파일 자체를 저장하는게 아니라 file은 uploads 폴더에 올라가고, db에는 file 주소만 가지고 있다.
        // 보통 db에 파일 자체를 넣으면 너무 무거워지기 때문에 잘 안그런다. file은 캐싱을 할 수 도있는데 마찬가지로 db에 넣으면 못하고 CDN (캐싱에서 속도 이점?)도 못 얻는다.
        // file은 보통 S3 클라우드에 올려서 CDN 캐싱을 적용하고 db는 파일의 접근할 수 있는 주소만 가지고 있다.
        const images = await Promise.all(
          req.body.image.map((image) => Image.create({ src: image }))
        );
        await post.addImages(images); // 위의 Post.create({}) 한 것에다가 알아서 images가 추가가 된다. 그리고 나중에 fullPost할 때 include 이미지하면 이미지 정보가 post.images로 들어간다.
      } else {
        // 이미지를 하나만 올리면 image: 모모.png
        const image = await Image.create({ src: req.body.image });
        await post.addImages(image);
      }
    }
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [
        {
          model: Image,
        },
        {
          model: Comment,
          include: [
            {
              model: User, // 댓글 작성자
              attributes: ['id', 'nickname'], // include의 User는 비밀번호는 빼야한다. (보안)
            },
          ],
        },
        {
          model: User, // 게시글 작성자
          attributes: ['id', 'nickname'], // include의 User는 비밀번호는 빼야한다. (보안)
        },
        {
          model: User, // 좋아요 누른 유저
          as: 'Likers',
          attributes: ['id'],
        },
      ],
    });
    // 프론트로 돌려주기 -> saga -> addPost result
    res.status(201).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.post('/images', isLoggedIn, upload.array('image'), (req, res, next) => {
  // upload.array('image') = postForm의 input에 전달 된다. array인 이유는 이미지를 여러장 올릴 수 있어서 한 장이면 single TEXT(json) 있을 때는 none()
  // POST /post/images
  console.log(req.files); // 업로드 된 이미지의 정보
  res.json(req.files.map((v) => v.filename)); // 프론트로 업로드 정보 넘겨준다.
  // 업로드 프로세스도 여러가지 방법이 있다.
  // 1번째
  // 브라우저에서 백엔드 서버에 폼 전송할 때 한 방에 전달 (멀티파트 방식 ex { content: '안녕' image:0101010102 })
  // 단점 : 1. 한방에 올리기 때문에 이미지 미리보기등 할 때 애매하다. 이미지 선택하고 content 치고 업로드 선택하면 바로 업로드 하는 방식 백엔드
  // 2. 이미지 업로드 한 후에야 이미지 리사이징 작업 머신러닝 등 돌릴 수 있고 업로드 시간이 좀 걸린다.

  // 2번째 요청 두 번 보내기
  // 첫 번 째 보낼때는 이미지만 먼저 선택해서 데이터를 보낸다. 그리고 서버에 업로드 해두면 v.filename return해줬기 때문에 (ex 모모.png) 이 정보를 활용해서
  // 서버쪽에서 이 주소를 알면 미리보기를 할 수 있고 리사이징 해놓고 그 사이에 사람들은 content 작성할 수 있다.
  // 좀 오래걸리는 것을 먼저 처리하고 그 다음에 contnet올리는 방식 (2번째 효율적이다.)
  // 단점 : 1. 요청 두 번 보내기 때문에 백엔드쪽에서 좀 더 복잡하다.
  // 2. 이미지를 먼저 올리면 중간에 이미지 올렸다가 마음이 바뀌어서 게시글 안 쓸 쑤도 있기떄문에 그러면 이미지만 업로드되고 게시글은 안써진다. (보통은 이미지를 안지우고 남겨둔다. 자산이기 때문에 (머신러닝 등))
});

router.post('/:postId/comment', isLoggedIn, async (req, res, next) => {
  // POST /post/1/comment
  try {
    // 악성 사용자가 10으로 바꾸고 삭제하거나 댓글 달 수 있기에 꼼꼼하게 검사
    const post = await Post.findOne({
      where: { id: req.params.postId },
    });
    if (!post) {
      // return 꼭 붙이기 센드가 두 번 실행되지 않게하기 위해 요청 1번에 응답 1번
      // return 안 붙이면 밑에 json까지 send 주의
      return res.status(403).send('존재하지 않는 게시글입니다');
    }

    const comment = await Comment.create({
      content: req.body.content,
      PostId: parseInt(req.params.postId, 10),
      UserId: req.user.id,
    });

    const fullComment = await Comment.findOne({
      where: { id: comment.id },
      include: [
        {
          model: User,
          attributes: ['id', 'nickname'], // include의 User는 비밀번호는 빼야한다. (보안)
        },
      ],
    });

    // 프론트로 돌려주기 -> saga -> addComment result
    res.status(201).json(fullComment);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.patch('/:postId/like', isLoggedIn, async (req, res, next) => {
  // PATCH /post/1/like
  // 관계형 Method 제공 (공통) post.addUser , post.getUser, post.setUser, post.removeUser 유저 생성, 유저 가져오기, 유저 수정, 유저 제거 (models/Post.associate)
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send('게시글이 존재하지 않습니다.');
    }
    await post.addLikers(req.user.id);
    res.json({ PostId: post.id, UserId: req.user.id }); // action.data부분
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:postId/like', isLoggedIn, async (req, res, next) => {
  // DELETE /post/1/like
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send('게시글이 존재하지 않습니다.');
    }
    await post.removeLikers(req.user.id);
    res.json({ PostId: post.id, UserId: req.user.id }); // action.data부분
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:postId', isLoggedIn, async (req, res, next) => {
  // DELETE /post/1
  try {
    await Post.destroy({
      // 제거할 때 쓰인다. destroy : 파괴하다
      where: {
        id: req.params.postId,
        UserId: req.user.id, // 내가 쓴 게시글이어야 한다.
      },
    });
    res.status(200).json({ PostId: parseInt(req.params.postId, 10) }); // params는 문자열이기 때문에 parseInt로 감싸준다 // action.data부분
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;

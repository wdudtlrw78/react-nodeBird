import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Avatar, Popover, List, Comment } from 'antd';
import { RetweetOutlined, HeartOutlined, MessageOutlined, EllipsisOutlined, HeartTwoTone } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import PostImages from './PostImages';
import CommentForm from './CommentForm';
import PostCardContent from './PostCardContent';

const PostCard = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [CommentFormOpend, setCommentFormOpend] = useState(false);
  const id = useSelector((state) => state.user.me?.id); // optional channing id가 없으면 undifined 반환

  const onToggleLike = useCallback(() => {
    setLiked((prev) => !prev);
  }, []);

  const onToggleComment = useCallback(() => {
    setCommentFormOpend((prev) => !prev);
  }, []);

  return (
    <div style={{ marginBottom: 20 }}>
      <Card
        // cover : antd 에서 내장된 옵션
        cover={post.Images[0] && <PostImages images={post.Images} />}
        actions={[
          <RetweetOutlined key="retweet" />,
          liked ? (
            <HeartTwoTone twoToneColor="#eb2f96" key="heart" onClick={onToggleLike} />
          ) : (
            <HeartOutlined key="heart" onClick={onToggleLike} />
          ),
          <MessageOutlined key="comment" onClick={onToggleComment} />,
          <Popover
            key="more"
            content={
              <Button.Group>
                {/*로그인 했고 내 아이디가 게시글 작성자 아이디와 같으면 수정 삭제 가능 다르면 신고 버튼 */}
                {id && post.User.id === id ? (
                  <>
                    <Button>수정</Button>
                    <Button type="danger">삭제</Button>
                  </>
                ) : (
                  <Button>신고</Button>
                )}
              </Button.Group>
            }
          >
            <EllipsisOutlined />
          </Popover>,
        ]}
      >
        <Card.Meta
          avatar={<Avatar>{post.User.nickname[0]}</Avatar>}
          title={post.User.nickname}
          description={<PostCardContent postData={post.content} />}
        />
      </Card>
      {CommentFormOpend && (
        <div>
          <CommentForm post={post} />
          <List
            header={`${post.Comments.length}개의 댓글`}
            itemLayout="horizontal"
            dataSource={post.Comments}
            renderItem={(item) => (
              <li>
                <Comment
                  author={item.User.nickname}
                  avatar={<Avatar>{item.User.nickname[0]}</Avatar>}
                  content={item.content}
                />
              </li>
            )}
          />
        </div>
      )}
    </div>
  );
};

PostCard.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.number,
    User: PropTypes.shape({
      id: PropTypes.number,
      nickname: PropTypes.string,
    }),
    content: PropTypes.string,
    createdAt: PropTypes.object,
    Comments: PropTypes.arrayOf(PropTypes.object),
    Images: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
};

export default PostCard;

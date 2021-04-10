import React, { useCallback } from "react";
import { Card, Avatar, Button } from "antd";
import { useDispatch } from "react-redux";

import { logoutAction } from "../reducers";

const UserProfile = () => {
  const dispatch = useDispatch();

  const onLogOut = useCallback(() => {
    // setIsLoggedIn(false);
    dispatch(logoutAction());
  }, []);

  return (
    <Card
      actions={[
        // React에서 배열사용 시 key 붙인다
        <div key="twit">
          짹짹
          <br />0
        </div>,
        <div key="followings">
          팔로잉
          <br />0
        </div>,
        <div key="follower">
          팔로워
          <br />0
        </div>,
      ]}
    >
      <Card.Meta title="MoMo" avatar={<Avatar>MM</Avatar>} />
      <Button onClick={onLogOut}>로그아웃</Button>
    </Card>
  );
};

export default UserProfile;

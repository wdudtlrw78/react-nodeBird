import React from 'react';
import ProTypes from 'prop-types';
import Link from 'next/link';
import { Menu } from 'antd';

const AppLayouts = ({ children }) => {
  return (
    <div>
      <Menu mode="horizontal">
        <Menu.Item>
          <Link href="/">
            <a>노드버드</a>
          </Link>
        </Menu.Item>
        <Menu.Item>
          <Link href="/profile">
            <a>프로필</a>
          </Link>
        </Menu.Item>
        <Menu.Item>
          <Link href="/signup">
            <a>회원가입</a>
          </Link>
        </Menu.Item>
      </Menu>
      {children}
    </div>
  );
};

AppLayouts.protoTyeps = {
  children: ProTypes.node.isRequired,
};

export default AppLayouts;
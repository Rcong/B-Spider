import React, { useState } from 'react';
import { Layout, FloatButton, message } from 'antd';
import { usePanelIdStore } from '@/stores/usePanelIdStore';
import { PlusOutlined } from '@ant-design/icons';
import { CardPanel } from './components/CardPanel'
import s from './root.module.scss'

const { Content } = Layout;

export const Root: React.FC = () => {

  const { panelIdList, setPanelIdList } = usePanelIdStore();

  const onAddClick = () => {
    const updatedIdList = [...panelIdList, `${Math.floor(Math.random() * 1000000)}`];
    setPanelIdList(updatedIdList);
  }

  return (
    <Layout className={s.layout}>
      <FloatButton
        className={s.addButton}
        type="primary"
        icon={<PlusOutlined />}
        onClick={onAddClick}
      />
      <Content className={s.content}>
        { panelIdList.map(panelId => <CardPanel className={s.mr12} key={panelId} panelId={panelId} /> ) }
      </Content>
    </Layout>

  )
};
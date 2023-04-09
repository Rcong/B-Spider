import React, { useState, useEffect } from 'react';
import type { RadioChangeEvent } from 'antd';
import { ipcRenderer } from 'electron'
import { Button, Form, Select, Input, Card, Divider, Timeline, Spin, Radio, message } from 'antd';
import { querySenseByKeyword, queryTimeline } from '@/lib/root-api';
import { divideInto, getYear, completeYearArray } from '@/lib/utils'
import { usePanelIdStore } from '@/stores/usePanelIdStore';
import { CloseOutlined } from '@ant-design/icons';
import { channelConst } from '@/const'
import s from './cardPanel.module.scss'
import c from 'classnames'


const { Search } = Input;

interface Props {
  panelId: string
  className?: string
}

export const CardPanel: React.FC<Props> = ({ panelId, className }) => {
  const [messageApi] = message.useMessage();
  const { panelIdList, setPanelIdList } = usePanelIdStore();
  const [senseLoading, setSenseLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [senseList, setSenseList] = useState<SenseItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [yearList, setYearList] = useState<YearItem[]>([]);
  const [yearToPosition, setYearToPosition] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<string>('timeline');
  const [selectedYear , setSelectedYear] = useState<string>('');

  useEffect(() => {
    ipcRenderer.on(`${channelConst.MAIN_PROCESS_SENSE_LIST}_${panelId}`, onSenseListChange)
    ipcRenderer.on(`${channelConst.MAIN_PROCESS_TIMELINE}_${panelId}`, onTimelineChange)
    return () => {
      ipcRenderer.off(`${channelConst.MAIN_PROCESS_SENSE_LIST}_${panelId}`, onSenseListChange)
      ipcRenderer.off(`${channelConst.MAIN_PROCESS_TIMELINE}_${panelId}`, onTimelineChange)
    }
  }, [])

  const onSearch = async (keyword: string) => {
    if (!keyword || !keyword.trim()) {
      messageApi.open({ type: 'warning', content: '请先输入关键词' });
      return
    }
    setSenseLoading(true);
    querySenseByKeyword({ panelId, keyword })
  };

  const onChange = (pageUrl: string) => {
    setTimelineLoading(true);
    queryTimeline({ panelId, pageUrl })
  };

  const onSenseListChange = (event: Electron.IpcRendererEvent, response: IpcRendererResponse<SenseItem>) => {
    const { code, data } = response;
    setSenseLoading(false);
    if (code === 0 || !data) {
      return
    }
    const { list } = data;      
    setSenseList(list);
  };

  const onTimelineChange = (event: Electron.IpcRendererEvent, response: IpcRendererResponse<TimelineItem>) => {
    try {
      const { code, data } = response;
      setTimelineLoading(false);
      if (code === 0 || !data) {
        return
      };
      const { list } = data;

      const yearToPositionMap = list.reduce((map: Record<string, string>, { children: str }) => {
        const yearStr = getYear(str);
        if (yearStr) {
          const strArray = divideInto(str);
          const yearArray = completeYearArray(yearStr.split('-'));
          for (let i = 0; i < yearArray.length; i+=1) {
            const year = yearArray[i];
            map[year] = map[year] ? (map[year] + `、${strArray[1]}`) : strArray[1]
          }
        }
        return map
      }, {})

      setYearToPosition(yearToPositionMap);

      const years = Object.keys(yearToPositionMap).map(year => ({ value: year, label: year }))
      setYearList(years);
      if (years.length > 0) {
        setSelectedYear(years[0].value);
      }
      setTimeline(list);
    } catch (error) {
      console.info(error)
    }
  };

  const onRadioChange = ({ target: { value } }: RadioChangeEvent) => { setTab(value) };

  const getTimeItem = () => {
    if (timelineLoading) {
      return <Spin />
    }

    if(!timeline || timeline.length === 0){
      return <></>
    }

    if (tab === 'timeline') {
      return <Timeline items={timeline} />
    }
    
    if (tab === 'timeSelect' && yearList.length > 0) {
      return (
        <>
          <Form layout="horizontal">
            <Form.Item label="年份">
              <Select defaultValue={selectedYear} onChange={setSelectedYear} options={yearList} />
            </Form.Item>
            <Form.Item>
              <Timeline items={[{ children: yearToPosition[selectedYear] }]} />
            </Form.Item>
          </Form>
        </>
      )
    }
  }

  const onRemoveClick = () => {
    const updatedIdList = panelIdList.filter(id => id !== panelId);
    setPanelIdList(updatedIdList);
  }

  return (
    <Card
      className={c(className, s.cardItem)}
      extra={
        <Button
          className={s.closeBtn}
          shape="circle"
          icon={<CloseOutlined />}
          onClick={onRemoveClick}
        />
      }
    >
      <Form layout="horizontal">
        <Form.Item label="关键词">
          <Search placeholder="请输入关键词搜索" onSearch={onSearch} />
        </Form.Item>
        {
          senseLoading ? <Spin /> :
            senseList && senseList.length > 0 &&
              <Form.Item label="义项">
                <Select
                  showSearch
                  placeholder="选择义项"
                  onChange={onChange}
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={senseList}
                />
              </Form.Item>
        }
        {
          timelineLoading ? <Spin /> :
            timeline && timeline.length > 0 &&
              <Form.Item label="时间展现模式">
                <Radio.Group defaultValue={tab} onChange={onRadioChange}>
                  <Radio.Button value="timeline">时间线</Radio.Button>
                  <Radio.Button value="timeSelect">时间选择</Radio.Button>
                </Radio.Group>
              </Form.Item>
        }
      </Form>
      <Divider />
      { getTimeItem() }
    </Card>
  )
}

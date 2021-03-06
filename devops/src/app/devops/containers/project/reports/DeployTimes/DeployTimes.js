import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { observable, action, configure } from 'mobx';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Page, Header, Content, stores, Permission } from 'choerodon-front-boot';
import { Select, Button, Table, Spin } from 'choerodon-ui';
import ReactEcharts from 'echarts-for-react';
import _ from 'lodash';
import moment from 'moment';
import ChartSwitch from '../Component/ChartSwitch';
import StatusTags from '../../../../components/StatusTags';
import TimePicker from '../Component/TimePicker';
import NoChart from '../Component/NoChart';
import ContainerStore from '../../../../stores/project/container';
import '../DeployDuration/DeployDuration.scss';

configure({ enforceActions: false });

const { AppState } = stores;
const { Option } = Select;

@observer
class DeployTimes extends Component {
  @observable env = [];

  @observable app = [];

  @observable envIds = undefined;

  @observable appId = 'all';

  @observable appArr = [];

  @observable dateArr = [];

  @observable successArr = [];

  @observable failArr = [];

  @observable allArr = [];

  handleRefresh = () => {
    this.loadEnvCards();
    this.loadApps();
  };

  /**
   * 选择环境
   * @param ids 环境ID
   */
  @action
  handleEnvSelect = (ids) => {
    this.envIds = ids;
    this.loadCharts();
  };

  /**
   * 选择应用
   * @param id 应用ID
   */
  @action
  handleAppSelect = (id) => {
    this.appId = id;
    this.loadCharts();
  };

  componentDidMount() {
    this.loadEnvCards();
    this.loadApps();
  }

  componentWillUnmount() {
    const { ReportsStore } = this.props;
    ReportsStore.setAllData([]);
    ReportsStore.setStartTime(moment().subtract(6, 'days'));
    ReportsStore.setEndTime(moment());
  }

  /**
   * 获取可用环境
   */
  @action
  loadEnvCards = () => {
    const projectId = AppState.currentMenuType.id;
    ContainerStore.loadActiveEnv(projectId)
      .then((env) => {
        if (env.length) {
          this.env = env;
          this.envIds = this.envIds || [env[0].id];
        }
        this.loadCharts();
      });
  };

  /**
   * 加载应用
   */
  @action
  loadApps = () => {
    const { ReportsStore } = this.props;
    const { id } = AppState.currentMenuType;
    ReportsStore.loadApps(id)
      .then((app) => {
        if (app.length) {
          this.app = app;
          this.appId = this.appId || 'all';
        }
      });
  };

  /**
   * 加载图表数据
   */
  @action
  loadCharts = () => {
    const { ReportsStore } = this.props;
    const projectId = AppState.currentMenuType.id;
    const startTime = ReportsStore.getStartTime.format().split('T')[0].replace(/-/g, '/');
    const endTime = ReportsStore.getEndTime.format().split('T')[0].replace(/-/g, '/');
    const appID = (this.appId === 'all') ? [] : this.appId;
    ReportsStore.loadDeployTimesChart(projectId, appID, startTime, endTime, this.envIds.slice())
      .then((res) => {
        if (res) {
          this.dateArr = res.creationDates;
          this.successArr = res.deploySuccessFrequency;
          this.failArr = res.deployFailFrequency;
          this.allArr = res.deployFrequencys;
        }
      });
    this.loadTables();
  };

  /**
   * 加载table数据
   */
  @action
  loadTables = () => {
    const { ReportsStore } = this.props;
    const projectId = AppState.currentMenuType.id;
    const startTime = ReportsStore.getStartTime.format().split('T')[0].replace(/-/g, '/');
    const endTime = ReportsStore.getEndTime.format().split('T')[0].replace(/-/g, '/');
    const appID = (this.appId === 'all') ? [] : this.appId;
    ReportsStore.loadDeployTimesTable(projectId, appID, startTime, endTime, this.envIds.slice());
  };

  /**
   * 渲染图表
   * @returns {*}
   */
  getOption() {
    const { intl: { formatMessage } } = this.props;
    const val = [{ name: `${formatMessage({ id: 'report.build-number.fail' })}` }, { name: `${formatMessage({ id: 'report.build-number.success' })}` }, { name: `${formatMessage({ id: 'report.build-number.total' })}` }];
    val[0].value = _.reduce(this.failArr, (sum, n) => sum + n);
    val[1].value = _.reduce(this.successArr, (sum, n) => sum + n);
    val[2].value = _.reduce(this.allArr, (sum, n) => sum + n);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: '#fff',
        textStyle: {
          color: '#000',
          fontSize: 13,
          lineHeight: 20,
        },
        padding: [10, 15, 10, 15],
        extraCssText:
          'box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2); border: 1px solid #ddd; border-radius: 0;',
        formatter(params, ticket) {
          if (params[1] && params[0]) {
            const total = params[0].value + params[1].value;
            return `<div>
                <div>${formatMessage({ id: 'branch.issue.date' })}：${params[1].name}</div>
                <div><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${params[1].color};"></span>${formatMessage({ id: 'appstore.deploy' })}${params[1].seriesName}：${params[1].value}</div>
                <div><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${params[0].color};"></span>${formatMessage({ id: 'appstore.deploy' })}${params[0].seriesName}：${params[0].value}</div>
                <div>${formatMessage({ id: 'appstore.deploy' })}${formatMessage({ id: 'report.build-number.total' })}：${total}</div>
                <div>${formatMessage({ id: 'appstore.deploy' })}${formatMessage({ id: 'report.build-number.success.rate' })}：${((params[0].value / total) * 100).toFixed(2)}%</div>
              <div>`;
          } else {
            return `<div>
                <div>${formatMessage({ id: 'branch.issue.date' })}：${params[0].name}</div>
                <div><span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${params[0].color};"></span>${formatMessage({ id: 'appstore.deploy' })}${params[0].seriesName}：${params[0].value}</div>
              <div>`;
          }
        },
      },
      legend: {
        left: 'right',
        itemWidth: 14,
        itemGap: 20,
        formatter(name) {
          let count = 0;
          _.map(val, (data) => {
            if (data.name === name) {
              count = data.value;
            }
          });
          return `${name}：${count}`;
        },
      },
      grid: {
        left: '2%',
        right: '3%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        axisTick: { show: false },
        axisLine: {
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 2,
          },
        },
        splitLine: {
          lineStyle: {
            color: ['#eee'],
            width: 1,
            type: 'solid',
          },
        },
        data: this.dateArr,
        axisLabel: {
          margin: 13,
          textStyle: {
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: 12,
          },
          formatter(value) {
            return value.slice(5, 10).replace('-', '/');
          },
        },
      },
      yAxis: {
        name: `${formatMessage({ id: 'report.build-number.yAxis' })}`,
        type: 'value',
        nameTextStyle: {
          fontSize: 13,
          color: '#000',
        },
        axisTick: { show: false },
        axisLine: {
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 2,
          },
        },
        axisLabel: {
          margin: 18,
          textStyle: {
            color: 'rgba(0, 0, 0, 0.65)',
            fontSize: 12,
          },
        },
        splitLine: {
          lineStyle: {
            color: '#eee',
            type: 'solid',
            width: 1,
          },
        },
      },
      series: [
        {
          name: `${formatMessage({ id: 'report.build-number.success' })}`,
          type: 'bar',
          color: '#00BFA5',
          barWidth: '40%',
          stack: 'total',
          data: this.successArr,
        },
        {
          name: `${formatMessage({ id: 'report.build-number.fail' })}`,
          type: 'bar',
          color: '#FFB100',
          barWidth: '40%',
          stack: 'total',
          data: this.failArr,
        },
        {
          name: `${formatMessage({ id: 'report.build-number.total' })}`,
          type: 'bar',
          color: 'transparent',
          stack: 'total',
        },
      ],
    };
  }

  /**
   * 表格函数
   * @returns {*}
   */
  renderTable() {
    const { intl: { formatMessage }, ReportsStore } = this.props;
    const data = ReportsStore.getAllData;

    const column = [
      {
        title: formatMessage({ id: 'app.active' }),
        key: 'status',
        render: record => (<StatusTags name={formatMessage({ id: record.status })} colorCode={record.status} />),
      }, {
        title: formatMessage({ id: 'report.deploy-duration.time' }),
        key: 'creationDate',
        dataIndex: 'creationDate',
      }, {
        title: formatMessage({ id: 'deploy.instance' }),
        key: 'appInstanceCode',
        dataIndex: 'appInstanceCode',
      }, {
        title: formatMessage({ id: 'deploy.appName' }),
        key: 'appName',
        dataIndex: 'appName',
      }, {
        title: formatMessage({ id: 'deploy.ver' }),
        key: 'appVersion',
        dataIndex: 'appVersion',
      }, {
        title: formatMessage({ id: 'report.deploy-duration.user' }),
        key: 'lastUpdatedName',
        dataIndex: 'lastUpdatedName',
      },
    ];

    return (
      <Table
        rowKey={record => record.creationDate}
        dataSource={data}
        filterBar={false}
        columns={column}
        // loading={tableLoading}
      />
    );
  }

  render() {
    const { intl: { formatMessage }, history, ReportsStore } = this.props;
    const { id, name, type, organizationId } = AppState.currentMenuType;
    const echartsLoading = ReportsStore.getEchartsLoading;

    const envDom = this.env.length ? _.map(this.env, d => (<Option key={d.id} value={d.id}>{d.name}</Option>)) : null;

    const appDom = this.app.length ? _.map(this.app, d => (<Option key={d.id} value={d.id}>{d.name}</Option>)) : null;

    return (<Page className="c7n-region">
      <Header
        title={formatMessage({ id: 'report.deploy-times.head' })}
        backPath={`/devops/reports?type=${type}&id=${id}&name=${name}&organizationId=${organizationId}`}
      >
        <ChartSwitch
          history={history}
          current="submission"
        />
        <Button
          icon="refresh"
          onClick={this.handleRefresh}
        >
          <FormattedMessage id="refresh" />
        </Button>
      </Header>
      <Content code="report.deploy-times" value={{ name }}>
        {this.app.length ? <React.Fragment>
          <div className="c7n-report-screen">
            <Select
              notFoundContent={formatMessage({ id: 'envoverview.noEnv' })}
              value={this.envIds && this.envIds.slice()}
              label={formatMessage({ id: 'deploy.envName' })}
              className="c7n-select_400"
              mode="multiple"
              maxTagCount={3}
              onChange={this.handleEnvSelect}
              optionFilterProp="children"
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              filter
            >
              {envDom}
            </Select>
            <Select
              notFoundContent={formatMessage({ id: 'envoverview.unlist' })}
              value={appDom ? this.appId : null}
              className="c7n-select_200"
              label={formatMessage({ id: 'deploy.appName' })}
              onChange={this.handleAppSelect}
              optionFilterProp="children"
              filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
              filter
            >
              {appDom}
              {appDom ? <Option key="all" value="all">{formatMessage({ id: 'report.all-app' })}</Option> : null}
            </Select>
            <TimePicker startTime={ReportsStore.getStartTime} endTime={ReportsStore.getEndTime} func={this.loadCharts} store={ReportsStore} />
          </div>
          <div className="c7n-report-content">
            <Spin spinning={echartsLoading}>
              <ReactEcharts
                option={this.getOption()}
                notMerge
                lazyUpdate
                style={{ height: '350px', width: '100%' }}
              />
            </Spin>
          </div>
          <div className="c7n-report-table">
            {this.renderTable()}
          </div>
        </React.Fragment> : <NoChart title={formatMessage({ id: 'report.no-app' })} des={formatMessage({ id: 'report.no-app-des' })} />}
      </Content>
    </Page>);
  }
}

export default injectIntl(DeployTimes);

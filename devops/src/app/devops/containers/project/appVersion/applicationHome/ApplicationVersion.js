import React, { Component } from 'react';
import { Table, Button, Select } from 'choerodon-ui';
import { observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Content, Header, Page, stores } from 'choerodon-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import _ from 'lodash';
import TimePopover from '../../../../components/timePopover';
import './ApplicationVersion.scss';
import '../../../main.scss';

const { AppState } = stores;
const { Option } = Select;

@observer
class ApplicationVersion extends Component {
  constructor(props) {
    super(props);
    const menu = AppState.currentMenuType;
    this.state = {
      page: 0,
      pageSize: 10,
      param: [],
      filters: {},
      postData: { searchParam: {}, param: '' },
      sorter: {
        filed: 'id',
        columnKey: 'id',
        order: 'descend',
      },
      appId: null,
    };
  }

  componentDidMount() {
    const { AppVersionStore } = this.props;
    const { id: projectId } = AppState.currentMenuType;
    AppVersionStore.queryAppData(projectId);
    this.loadAllData();
  }

  /**
   * 选择应用
   * @param e
   */
  handleAppSelect = e => this.setState({ appId: e }, () => this.loadAllData());

  tableChange = (pagination, filters, sorter, paras) => {
    const { current, pageSize } = pagination;
    const page = current - 1;
    const sort = _.isEmpty(sorter) ? {
      filed: 'id',
      columnKey: 'id',
      order: 'descend',
    } : sorter;
    let searchParam = {};
    let param = '';
    if (Object.keys(filters).length) {
      searchParam = filters;
    }
    if (paras.length) {
      param = paras[0].toString();
    }
    const postData = {
      searchParam,
      param,
    };
    this.setState({ page, pageSize, filters, postData, sorter: sort });
    this.loadAllData(page, pageSize, sort, postData);
  };

  /**
   * 刷新
   */
  handleRefresh = () => {
    const { page, pageSize, sorter, postData } = this.state;
    this.loadAllData(page, pageSize, sorter, postData);
  };

  loadAllData = (page = 0, sizes = 10, sort = { field: 'id', order: 'descend' }, filter = { searchParam: {}, param: '' }) => {
    const { AppVersionStore } = this.props;
    const { appId } = this.state;
    const { id: projectId } = AppState.currentMenuType;
    AppVersionStore.loadData(projectId, appId, page, sizes, sort, filter);
  };

  render() {
    const { AppVersionStore, intl } = this.props;
    const versionData = AppVersionStore.getAllData;
    const appData = AppVersionStore.getAppData;
    const { name } = AppState.currentMenuType;
    const {
      param,
      filters,
      sorter: { columnKey, order },
      appId,
    } = this.state;
    const columns = [{
      title: <FormattedMessage id="app.appVersion" />,
      dataIndex: 'version',
      key: 'version',
      sorter: true,
      sortOrder: columnKey === 'version' && order,
      filters: [],
      filteredValue: filters.version || [],
    }, {
      title: <FormattedMessage id="app.code" />,
      dataIndex: 'appCode',
      key: 'appCode',
      sorter: true,
      sortOrder: columnKey === 'appCode' && order,
      filters: [],
      filteredValue: filters.appCode || [],
    }, {
      title: <FormattedMessage id="app.name" />,
      dataIndex: 'appName',
      key: 'appName',
      sorter: true,
      sortOrder: columnKey === 'appName' && order,
      filters: [],
      filteredValue: filters.appName || [],
    }, {
      title: <FormattedMessage id="app.createTime" />,
      dataIndex: 'creationDate',
      key: 'creationDate',
      sorter: true,
      render: (text, record) => <TimePopover content={record.creationDate} />,
    }];

    return (
      <Page
        className="c7n-region c7n-appVersion-wrapper"
        service={[
          'devops-service.application.listByActive',
          'devops-service.application-version.pageByOptions',
        ]}
      >
        <Header title={<FormattedMessage id="app.version" />}>
          <Button
            onClick={this.handleRefresh}
          >
            <i className="icon-refresh icon" />
            <FormattedMessage id="refresh" />
          </Button>
        </Header>
        <Content code="appVer" value={{ name }}>
          <Select
            className="c7n-select_512 c7n-appVersion-select"
            value={appId}
            label={this.props.intl.formatMessage({ id: 'chooseApp' })}
            filterOption={(input, option) => option.props.children.toLowerCase().indexOf(input.toLowerCase()) >= 0}
            filter
            onChange={this.handleAppSelect}
          >
            {
              _.map(appData, app => <Option key={app.id} value={app.id}>{app.name}</Option>)
            }
          </Select>
          <Table
            filterBarPlaceholder={intl.formatMessage({ id: 'filter' })}
            loading={AppVersionStore.loading}
            pagination={AppVersionStore.pageInfo}
            columns={columns}
            filters={param || []}
            dataSource={versionData}
            rowKey={record => record.id}
            onChange={this.tableChange}
          />
        </Content>
      </Page>
    );
  }
}

export default withRouter(injectIntl(ApplicationVersion));

import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import { Button, Steps, Tabs, Tooltip, Icon } from 'choerodon-ui';
import { Content, Header, Page, Permission, stores } from 'choerodon-front-boot';
import classnames from 'classnames';
import { injectIntl, FormattedMessage } from 'react-intl';
import CodeMirror from 'react-codemirror';
import TimePopover from '../../../../components/timePopover';
import '../../../main.scss';
import './Deploydetail.scss';
import '../../container/containerHome/ContainerHome.scss';
// import Log from '../../appDeployment/component/log';
import LoadingBar from '../../../../components/loadingBar';
import Ace from '../../../../components/yamlAce';

const Step = Steps.Step;
const TabPane = Tabs.TabPane;

const { AppState } = stores;

require('codemirror/lib/codemirror.css');
require('codemirror/mode/yaml/yaml');
require('codemirror/mode/textile/textile');
require('codemirror/theme/base16-light.css');
require('codemirror/theme/base16-dark.css');

@observer
class DeploymentDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: props.match.params.id,
      status: props.match.params.status,
      expand: false,
      current: 1,
      flag: true,
    };
  }

  componentDidMount() {
    const { DeployDetailStore } = this.props;
    const { id } = this.state;
    const projectId = AppState.currentMenuType.id;
    DeployDetailStore.getInstanceValue(projectId, id);
    DeployDetailStore.getResourceData(projectId, id);
    DeployDetailStore.getStageData(projectId, id);
  }

  /**
   * 获取pipe的icon
   * @param status 数据状态
   * @param index 遍历的索引
   */
  getIcon =(status, index) => {
    const { current } = this.state;
    let icon = (current === index) ? 'album' : 'cancle_a';
    let iconStyle = 'stage-icon';
    const indexArr = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];// icon的类名设计
    switch (status) {
      case 'Created':
        icon = (current === index) ? `icon-wait_${indexArr[index]}_b` : `icon-wait_${indexArr[index]}_a`;
        break;
      case 'success':
        icon = (current === index) ? 'check_circle' : 'finished';
        iconStyle = 'stage-icon icon-success';
        break;
      case 'Failed':
        icon = (current === index) ? 'icon-cancel' : 'icon-highlight_off';
        break;
      case 'Running':
        icon = (current === index) ? 'watch_later' : 'schedule';
        break;
      case 'Skipped':
        icon = (current === index) ? 'icon-skipped_b ' : 'icon-skipped_a';
        break;
      default:
        icon = (current === index) ? 'error' : 'error_outline';
        iconStyle = 'stage-icon icon-error';
    }
    return <Icon type={icon} className={iconStyle} />;
  };

  /**
   * 拼接返回的时间
   * @param time
   * @returns {*}
   */

  getTime =(time) => {
    const { intl } = this.props;
    let times;
    if (time && time.length) {
      if (time[3]) {
        times = `${time[3]}${intl.formatMessage({ id: 'ist.sec' })}`;
      } else if (time[2]) {
        times = `${time[2]}${intl.formatMessage({ id: 'ist.min' })}${time[3]}${intl.formatMessage({ id: 'ist.sec' })}`;
      } else if (time[1]) {
        times = `${time[1]}${intl.formatMessage({ id: 'ist.hour' })}${time[2]}${intl.formatMessage({ id: 'ist.min' })}${time[3]}${intl.formatMessage({ id: 'ist.sec' })}`;
      } else if (time[0]) {
        times = `${time[0]}${intl.formatMessage({ id: 'ist.day' })}${time[1]}${intl.formatMessage({ id: 'ist.hour' })}${time[2]}${intl.formatMessage({ id: 'ist.min' })}${time[3]}${intl.formatMessage({ id: 'ist.sec' })}`;
      }
    }
    return times;
  };

  loadAllData =() => {
    const { DeployDetailStore } = this.props;
    const { id } = this.state;
    const projectId = AppState.currentMenuType.id;
    DeployDetailStore.loadAllData(projectId, id);
  };

  changeStage =(index) => {
    const { DeployDetailStore, intl } = this.props;
    const data = DeployDetailStore.getStage;
    this.setState({ current: index + 1, log: data[index].log || intl.formatMessage({ id: 'ist.nolog' }) });
  };

  changeStatus =() => {
    const { expand } = this.state;
    this.setState({ expand: !expand });
  };

  handleClose =() => {
    const { DeployDetailStore } = this.props;
    DeployDetailStore.changeLogVisible(false);
  };

  handleValue=(key) => {
    this.setState({ flag: key });
  };

  render() {
    const { DeployDetailStore, intl } = this.props;
    const { expand, log } = this.state;
    const valueStyle = classnames({
      'c7n-deployDetail-show': expand,
      'c7n-deployDetail-hidden': !expand,
    });
    const resource = DeployDetailStore.getResource;
    const projectName = AppState.currentMenuType.name;
    const organizationId = AppState.currentMenuType.organizationId;
    const projectId = AppState.currentMenuType.id;
    const type = AppState.currentMenuType.type;
    let serviceDTO = [];
    let podDTO = [];
    let depDTO = [];
    let rsDTO = [];
    let ingressDTO = [];
    if (resource) {
      serviceDTO = resource.serviceDTOS;
      podDTO = resource.podDTOS;
      depDTO = resource.deploymentDTOS;
      rsDTO = resource.replicaSetDTOS;
      ingressDTO = resource.ingressDTOS;
    }

    const stageData = DeployDetailStore.getStage || [];
    const logger = (stageData.length && stageData[0].log) ? stageData[0].log : intl.formatMessage({ id: 'ist.nolog' });
    const logValues = log || logger;

    const dom = [];
    if (stageData.length) {
      stageData.map((step, index) => {
        const title = (<div>
          <div className={`${index}-stage-title stage-title-text`}>{step.stageName}</div>
          {step.stageTime && <span className="c7n-stage-time">{intl.formatMessage({ id: 'ist.time' })}:{this.getTime(step.stageTime)}</span>}
        </div>);
        dom.push(<Step
          key={step.weight}
          icon={step.status ? <Tooltip trigger="hover" placement="top" title={step.status}>
            {this.getIcon(step.status, index + 1)}
          </Tooltip> : <span>{this.getIcon(step.status, index + 1)}</span>}
          onClick={this.changeStage.bind(this, index)}
          title={title}
        />);
        return dom;
      });
    }
    const a = DeployDetailStore.getValue;
    const options = {
      theme: 'base16-light',
      mode: 'yaml',
      readOnly: true,
      lineNumbers: true,
    };
    const logOptions = {
      theme: 'base16-dark',
      mode: 'textile',
      readOnly: true,
      lineNumbers: true,
    };
    const Logger = () => (<CodeMirror
      className="c7n-deployDetail-pre1"
      value={logValues}
      options={logOptions}
    />);
    return (
      <Page
        className="c7n-region c7n-deployDetail-wrapper"
        service={[
          'devops-service.application-instance.listStages',
          'devops-service.application-instance.queryValues',
          'devops-service.application-instance.listResources',
        ]}
      >
        <Header title={<FormattedMessage id="ist.detail" />} backPath={`/devops/instance?type=${type}&id=${projectId}&name=${projectName}&organizationId=${organizationId}`}>
          <Button
            onClick={this.loadAllData}
            funcType="flat"
          >
            <span className="icon-refresh icon" />
            <FormattedMessage id="refresh" />
          </Button>
        </Header>
        { DeployDetailStore.isLoading ? <LoadingBar display /> : <Content className="page-content">
          <h2 className="c7n-space-first">
            <FormattedMessage
              id="ist.isthead"
              values={{
                name: `${projectName}`,
              }}
            />
          </h2>
          <p>
            <FormattedMessage id="ist.istDes" />
            <a href={intl.formatMessage({ id: 'ist.link' })} rel="nofollow me noopener noreferrer" target="_blank" className="c7n-external-link">
              <span className="c7n-external-link-content">
                <FormattedMessage id="learnmore" />
              </span>
              <span className="icon icon-open_in_new" />
            </a>
          </p>
          <Tabs
            onChange={this.handleValue}
            className="c7n-deployDetail-tab"
            defaultActiveKey={this.state.status === 'running' ? '1' : '2'}
          >
            {this.state.status === 'running' && <TabPane tab={intl.formatMessage({ id: 'ist.runDetial' })} key="1">
              <div className="c7n-deployDetail-card c7n-deployDetail-card-content ">
                <h2 className="c7n-space-first">Resources</h2>
                {podDTO.length >= 1 && <div className="c7n-deployDetail-table-header header-first">
                  <span className="c7n-deployDetail-table-title">Pod</span>
                  <table className="c7n-deployDetail-table">
                    <thead>
                      <tr>
                        <td>NAME</td>
                        <td>READY</td>
                        <td>STATUS</td>
                        <td>RESTARTS</td>
                        <td>AGE</td>
                      </tr>
                    </thead>
                    <tbody>
                      {podDTO.map(pod => (<tr key={Math.random()}>
                        <td>{pod.name}</td>
                        <td>{pod.ready}</td>
                        <td>{pod.status}</td>
                        <td>{pod.restarts}</td>
                        <td><TimePopover content={pod.age} /></td>
                      </tr>))}
                    </tbody>
                  </table>
                </div> }
                { serviceDTO.length >= 1 && <div className="c7n-deployDetail-table-header">
                  <span className="c7n-deployDetail-table-title">Service</span>
                  <table className="c7n-deployDetail-table">
                    <thead>
                      <tr>
                        <td>NAME</td>
                        <td>TYPE</td>
                        <td>CLUSTER-IP</td>
                        <td>EXTERNAL-IP</td>
                        <td>PORT(S)</td>
                        <td>AGE</td>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceDTO.map(service => (<tr key={Math.random()}>
                        <td>{service.name}</td>
                        <td>{service.type}</td>
                        <td>{service.clusterIp}</td>
                        <td>{service.externalIp}</td>
                        <td>{service.port}</td>
                        <td><TimePopover content={service.age} /></td>
                      </tr>))}
                    </tbody>
                  </table>
                </div> }
                { depDTO.length >= 1 && <div className="c7n-deployDetail-table-header">
                  <span className="c7n-deployDetail-table-title">Deployment</span>
                  <table className="c7n-deployDetail-table">
                    <thead>
                      <tr>
                        <td>NAME</td>
                        <td>DESIRED</td>
                        <td>CURRENT</td>
                        <td>UP-TO-DATE</td>
                        <td>AVAILABLE</td>
                        <td>AGE</td>
                      </tr>
                    </thead>
                    <tbody>
                      {depDTO.map(dep => (
                        <tr key={Math.random()}>
                          <td>{dep.name}</td>
                          <td>{dep.desired}</td>
                          <td>{dep.current}</td>
                          <td>{dep.upToDate}</td>
                          <td>{dep.available ? intl.formatMessage({ id: 'ist.y' }) : intl.formatMessage({ id: 'ist.n' })}</td>
                          <td><TimePopover content={dep.age} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div> }
                { ingressDTO.length >= 1 && <div className="c7n-deployDetail-table-header">
                  <span className="c7n-deployDetail-table-title">Ingress</span>
                  <table className="c7n-deployDetail-table">
                    <thead>
                      <tr>
                        <td>NAME</td>
                        <td>HOSTS</td>
                        <td>ADDRESS</td>
                        <td>PORTS</td>
                        <td>AGE</td>
                      </tr>
                    </thead>
                    <tbody>
                      {ingressDTO.map(dep => (
                        <tr key={Math.random()}>
                          <td>{dep.name}</td>
                          <td>{dep.hosts}</td>
                          <td>{dep.address}</td>
                          <td>{dep.port}</td>
                          <td><TimePopover content={dep.age} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div> }
                { rsDTO.length >= 1 && <div className="c7n-deployDetail-table-header">
                  <span className="c7n-deployDetail-table-title">ReplicaSet</span>
                  <table className="c7n-deployDetail-table">
                    <thead>
                      <tr>
                        <td>NAME</td>
                        <td>DESIRED</td>
                        <td>CURRENT</td>
                        <td>READY</td>
                        <td>AGE</td>
                      </tr>
                    </thead>
                    <tbody>
                      {rsDTO.map(dep => (
                        <tr key={Math.random()}>
                          <td>{dep.name}</td>
                          <td>{dep.desired}</td>
                          <td>{dep.current}</td>
                          <td>{dep.ready}</td>
                          <td><TimePopover content={dep.age} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div> }
              </div>
            </TabPane> }
            <TabPane tab={intl.formatMessage({ id: 'deploy.detail' })} key="2">
              <div className="c7n-deployDetail-card c7n-deployDetail-card-content ">
                <h2 className="c7n-space-first c7n-h2-inline c7n-deployDetail-title">{intl.formatMessage({ id: 'deploy.info' })}</h2>
                <div role="none" className="c7n-deployDetail-expand" onClick={this.changeStatus}>
                  <Button shape="circle">
                    {this.state.expand ?
                      <span className="icon icon-expand_more" />
                      : <span className="icon icon-expand_less" />
                    }
                  </Button>
                </div>
                <div className={valueStyle}>
                  {DeployDetailStore.getValue && this.state.expand
                  &&
                  <Ace
                    options={options}
                    ref={(instance) => { this.codeEditor = instance; }}
                    value={DeployDetailStore.getValue.yaml}
                  />
                  }
                </div>
              </div>
              {stageData.length >= 1 && <div className="c7n-deployDetail-card-content">
                <h2 className="c7n-space-first c7n-deployDetail-title">{intl.formatMessage({ id: 'deploy.stage' })}</h2>
                <Steps current={this.state.current} className="c7n-deployDetail-steps">
                  {dom}
                </Steps>
                <Logger />
              </div>
              }
            </TabPane>
          </Tabs>
        </Content>}
      </Page>);
  }
}
export default withRouter(injectIntl(DeploymentDetail));

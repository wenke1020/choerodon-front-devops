import { observable, action, computed } from 'mobx';
import { axios, store } from 'choerodon-front-boot';
import { handleProptError } from '../../../utils';

const HEIGHT = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
@store('ContainerStore')
class ContainerStore {
  @observable allData = [];

  @observable isRefresh = false;

  // 页面的loading
  @observable loading = false;

  // 打开tab的loading
  @observable show = false;

  @observable logs = '';

  @observable pageInfo = {
    current: 1, total: 0, pageSize: HEIGHT <= 900 ? 10 : 15,
  };

  @observable appdata = [];

  @observable envcard = [];

  @observable filterValue = '';

  @observable Info = {
    filters: {}, sort: { columnKey: 'id', order: 'descend' }, paras: [],
  };

  @observable envId = null;

  @observable appId = null;

  @action setPageInfo(page) {
    this.pageInfo.current = page.number + 1;
    this.pageInfo.total = page.totalElements;
    this.pageInfo.pageSize = page.size;
  }

  @computed get getPageInfo() {
    return this.pageInfo;
  }

  @action changeShow(flag) {
    this.show = flag;
  }

  @computed get getAllData() {
    return this.allData;
  }

  @action setAllData(data) {
    this.allData = data;
  }

  @action changeIsRefresh(flag) {
    this.isRefresh = flag;
  }

  @computed get getIsRefresh() {
    return this.isRefresh;
  }

  @action changeLoading(flag) {
    this.loading = flag;
  }

  @computed get getLoading() {
    return this.loading;
  }

  @action setLog(logs) {
    this.logs = logs;
  }

  @computed get getLog() {
    return this.logs;
  }

  @action setEnvcard(envcard) {
    this.envcard = envcard;
  }

  @computed get getEnvcard() {
    return this.envcard;
  }

  @action setAppDate(data) {
    this.appdata = data;
  }

  @computed get getAppData() {
    return this.appdata;
  }

  @action setFilterValue(filterValue) {
    this.filterValue = filterValue;
  }

  @computed get getFilterValue() {
    return this.filterValue;
  }

  @action setInfo(Info) {
    this.Info = Info;
  }

  @computed get getInfo() {
    return this.Info;
  }

  @action setenvId(id) {
    this.envId = id;
  }

  @computed get getenvId() {
    return this.envId;
  }

  @action setappId(id) {
    this.appId = id;
  }

  @computed get getappId() {
    return this.appId;
  }


  loadActiveEnv = projectId => axios.get(`devops/v1/projects/${projectId}/envs?active=true`)
    .then((data) => {
      if (data && data.failed) {
        Choerodon.prompt(data.message);
      } else {
        this.setEnvcard(data);
      }
      return data;
    });

  loadAppData = projectId => axios.get(`devops/v1/projects/${projectId}/apps/list_all`).then((data) => {
    const res = handleProptError(data);
    if (res) {
      this.setAppDate(data);
    }
  });

  loadAppDataByEnv = (projectId, envId) => axios.get(`devops/v1/projects/${projectId}/apps/options?envId=${envId}&status=running`).then((data) => {
    const res = handleProptError(data);
    if (res) {
      this.setAppDate(data);
    }
    return res;
  });

  loadData = (isRefresh = false, proId, envId = this.envId, appId = this.appId, page = this.pageInfo.current - 1, size = this.pageInfo.pageSize, sort = { field: 'id', order: 'desc' }, datas = {
    searchParam: {},
    param: '',
  }) => {
    if (isRefresh) {
      this.changeIsRefresh(true);
    }
    this.changeLoading(true);
    let api = '';
    if (envId) {
      if (appId) {
        api = `&envId=${envId}&appId=${appId}`;
      } else {
        api = `&envId=${envId}`;
      }
    } else if (appId) {
      api = `&appId=${appId}`;
    }
    return axios.post(`/devops/v1/projects/${proId}/app_pod/list_by_options?page=${page}&size=${size}&sort=${sort.field || 'id'},${sort.order}${api}`, JSON.stringify(datas))
      .then((data) => {
        const res = this.handleProptError(datas);
        if (res) {
          this.handleData(data);
        }
        this.changeLoading(false);
        this.changeIsRefresh(false);
      });
  };

  handleData = (data) => {
    this.setAllData(data.content);
    const { number, size, totalElements } = data;
    const page = { number, size, totalElements };
    this.setPageInfo(page);
  };

  loadPodParam(projectId, id, type) {
    if (type) {
      return axios.get(`devops/v1/projects/${projectId}/app_pod/${id}/containers/logs/${type}`)
        .then(datas => this.handleProptError(datas));
    } else {
      return axios.get(`devops/v1/projects/${projectId}/app_pod/${id}/containers/logs`)
        .then(datas => this.handleProptError(datas));
    }
  }

  handleProptError =(error) => {
    if (error && error.failed) {
      Choerodon.prompt(error.message);
      return false;
    } else {
      return error;
    }
  }
}

const containerStore = new ContainerStore();
export default containerStore;

import { observable, action, computed } from 'mobx';
import { axios, store } from 'choerodon-front-boot';
import { handleProptError } from '../../../utils';

@store('AppTagStore')
class AppTagStore {
  @observable tagData = [];

  @observable appData = [];

  @observable selectedApp = null;

  @observable defaultAppName = null;

  // 防止初次为false时对页面的判断
  @observable loading = null;

  @observable pageInfo = {
    current: 0,
    total: 0,
    pageSize: 10,
  };

  @observable branchData = [];

  @action setTagData(data) {
    this.tagData = data;
  }

  @computed get getTagData() {
    return this.tagData;
  }

  @action setAppData(data) {
    this.appData = data;
  }

  @computed get getAppData() {
    return this.appData.slice();
  }

  @action setSelectApp(app) {
    this.selectedApp = app;
  }

  @computed get getSelectApp() {
    return this.selectedApp;
  }

  @action setDefaultAppName(name) {
    this.defaultAppName = name;
  }

  @computed get getDefaultAppName() {
    return this.defaultAppName;
  }

  @action setLoading(flag) {
    this.loading = flag;
  }

  @computed get getLoading() {
    return this.loading;
  }

  @action setPageInfo(pages) {
    this.pageInfo = pages;
  }

  @computed get getPageInfo() {
    return this.pageInfo;
  }

  @action setBranchData(data) {
    this.branchData = data;
  }

  @computed get getBranchData() {
    return this.branchData;
  }

  queryTagData = (projectId, page = 0, sizes = 10, postData = { searchParam: {}, param: '' }) => {
    if (this.selectedApp) {
      this.setLoading(true);
      axios.post(`/devops/v1/projects/${projectId}/apps/${this.selectedApp}/git/tags_list_options?page=${page}&size=${sizes}`, JSON.stringify(postData))
        .then((data) => {
          this.setLoading(false);
          const result = handleProptError(data);
          if (result) {
            const { content, totalElements, number, size } = result;
            this.setTagData(content);
            this.setPageInfo({ current: number + 1, pageSize: size, total: totalElements });
          }
        }).catch((err) => {
          Choerodon.handleResponseError(err);
          this.setLoading(false);
        });
    }
  };

  /**
   * 查询该项目下的所有应用
   * @param projectId
   * @returns {Promise<T>}
   */
  queryAppData = (projectId) => {
    this.setTagData([]);
    this.setAppData([]);
    this.setSelectApp(null);
    axios.get(`/devops/v1/projects/${projectId}/apps`)
      .then((data) => {
        const result = handleProptError(data);
        if (result) {
          this.setAppData(result);
          if (result.length) {
            // 没有应用时不请求tag
            this.setSelectApp(result[0].id);
            this.setDefaultAppName(result[0].name);
            this.queryTagData(projectId, 0, 10);
          }
        }
      }).catch(err => Choerodon.handleResponseError(err));
  };

  /**
   * 查询应用下的所有分支
   * @param projectId
   * @param appId
   * @returns {Promise<T>}
   */
  queryBranchData = ({ projectId, sorter = { field: 'createDate', order: 'asc' }, postData = { searchParam: {}, param: '' }, size = 3 }) => {
    axios.post(`/devops/v1/projects/${projectId}/apps/${this.selectedApp}/git/branches?page=0&size=${size}`, JSON.stringify(postData)).then((data) => {
      const result = handleProptError(data);
      if (result) {
        this.setBranchData(result);
      }
    }).catch(err => Choerodon.handleResponseError(err));
  };

  /**
   * 检查标记名称的唯一性
   * @param projectId
   * @param name
   */
  checkTagName = (projectId, name) => axios.get(`/devops/v1/projects/${projectId}/apps/${this.selectedApp}/git/tags_check?tag_name=${name}`);

  /**
   * 创建tag
   * @param projectId
   * @param tag tag名称
   * @param ref 来源分支
   * @param release 发布日志
   */
  createTag = (projectId, tag, ref, release) => axios.post(`/devops/v1/projects/${projectId}/apps/${this.selectedApp}/git/tags?tag=${tag}&ref=${ref}`, release);

  /**
   * 编辑发布日志
   * @param projectId
   * @param tag
   * @param release
   * @returns {IDBRequest | Promise<void>}
   */
  editTag = (projectId, tag, release) => axios.put(`/devops/v1/projects/${projectId}/apps/${this.selectedApp}/git/tags?tag=${tag}`, release);

  /**
   * 删除标记
   * @param projectId
   * @param tag
   */
  deleteTag = (projectId, tag) => axios.delete(`/devops/v1/projects/${projectId}/apps/${this.selectedApp}/git/tags?tag=${tag}`);
}

const appTagStore = new AppTagStore();
export default appTagStore;

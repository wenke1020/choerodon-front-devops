import { observable, action, computed } from 'mobx';
import { axios, store, stores } from 'choerodon-front-boot';
import _ from 'lodash';
import { handleProptError } from '../../../utils';

const { AppState } = stores;

@store('CertificateStore')
class CertificateStore {
  @observable envData = [];

  @observable certData = [];

  @observable loading = false;

  @observable pageInfo = {
    current: 0,
    total: 0,
    pageSize: 10,
  };

  @action setEnvData(data) {
    this.envData = data;
  }

  @computed get getEnvData() {
    return this.envData;
  }

  @action setCertData(data) {
    this.certData = data;
  }

  @computed get getCertData() {
    return this.certData;
  }

  @action setCertLoading(flag) {
    this.loading = flag;
  }

  @computed get getCertLoading() {
    return this.loading;
  }

  @action setPageInfo(pages) {
    this.pageInfo = pages;
  }

  @computed get getPageInfo() {
    return this.pageInfo;
  }

  /**
   * 加载项目下所有环境
   * @param projectId
   */
  loadEnvData = (projectId) => {
    const activeEnv = axios.get(`/devops/v1/projects/${projectId}/envs?active=true`);
    const invalidEnv = axios.get(`/devops/v1/projects/${projectId}/envs?active=false`);
    Promise.all([activeEnv, invalidEnv]).then((values) => {
      this.setEnvData(_.concat(values[0], values[1]));
    }).catch((err) => {
      Choerodon.handleResponseError(err);
    });
  };

  /**
   * 加载证书列表
   * @param projectId
   * @param envId
   * @param page
   * @param sizes
   * @param sort
   * @param postData
   */
  loadCertData = ({ projectId, page = 0, sizes = 10, sort = { field: 'id', order: 'asc' }, postData = { searchParam: {}, param: '' } }) => {
    this.setCertLoading(true);
    axios.post(`/devops/v1/projects/${projectId}/certifications/list_by_options?page=${page}&size=${sizes}&sort=${sort.field},${sort.order}`, JSON.stringify(postData))
      .then((data) => {
        this.setCertLoading(false);
        const res = handleProptError(data);
        if (res) {
          const { content, totalElements, number, size } = res;
          this.setPageInfo({ current: number + 1, pageSize: size, total: totalElements });
          this.setCertData(content);
        }
      })
      .catch((err) => {
        this.setCertLoading(false);
        Choerodon.handleResponseError(err);
      });
  };

  /**
   * 名字唯一性检查
   * @param projectId
   * @param value
   * @param envId
   */
  checkCertName = (projectId, value, envId) => Promise.resolve(true);

  /**
   * 创建证书
   * @param projectId
   * @param data
   * @returns {JQueryXHR | * | void}
   */
  createCert = (projectId, data) => axios.post(`/devops/v1/projects/${projectId}/certifications`, data, { header: { 'Content-Type': 'multipart/form-data' } });

  /**
   * 删除证书
   * @param projectId
   * @param certId
   * @returns {*}
   */
  deleteCertById = (projectId, certId) => axios.delete(`/devops/v1/projects/${projectId}/certifications?cert_id=${certId}`);
}

const certificateStore = new CertificateStore();

export default certificateStore;